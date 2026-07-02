import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';


export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw procurement request data from the Android app
    const { id, remarks } = data;
    
    // Extract new fields from the Quick Fill / Android update mapping exact columns
    const mr_no = data.mrNo || data.mr_no || 'Unknown';
    const supplier = data.supplierName || data.supplier || 'Unknown';
    const unit_price = data.unitPrice || data.unit_price || '0.00';
    const project_name = data.projectName || data.site || 'Unknown';
    const project_code = data.projectCode || data.project_code || 'Unknown';
    const site_name = data.siteName || data.site_name || 'Unknown';
    const site_code = data.siteCode || data.site_code || 'Unknown';
    const material_name = data.materialName || data.material_name || data.title || 'Unknown Material';
    const quantity = data.quantity || 'Unknown';
    const required_date = data.requiredDate || data.required_date || 'Unknown';

    // 1. Fetch "Rulebook" from materials_master
    let approvedVendor = 'Unknown (No Master Record)';
    let standardPrice = 'Unknown';
    // Extract base material name before any parentheses (e.g. "Copper Wiring (100m)" -> "Copper Wiring")
    const baseMaterialName = material_name.split(' (')[0].trim();

    const { data: materialMaster, error: masterError } = await supabase
      .from('master_materials')
      .select('*')
      .ilike('material_name', `%${baseMaterialName}%`)
      .limit(1)
      .single();

    if (masterError) {
      console.log("Master DB lookup error (or 0 rows):", masterError);
    }

    if (materialMaster) {
      approvedVendor = materialMaster.approved_vendor || materialMaster.vendor || materialMaster.supplierName || approvedVendor;
      standardPrice = materialMaster.standard_price?.toString() || materialMaster.standard_unit_price?.toString() || materialMaster.unit_price?.toString() || standardPrice;
    }

    // 2. Fetch Historical Context for Stock Shortage Prediction
    let historyText = "No recent orders recorded for this site.";
    const { data: recentOrders } = await supabase
      .from('mr_procurement')
      .select('created_at')
      .eq('projectName', project_name)
      .neq('id', id || -1)
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentOrders && recentOrders.length > 0) {
      historyText = `This site has submitted ${recentOrders.length} MRs recently. Last order was on: ${new Date(recentOrders[0].created_at).toLocaleDateString()}`;
    }

    // 2.5 Fetch Historical Pricing Data for Pricing Trends
    let pricingTrendContext = "No historical pricing data available.";
    const { data: pastOrders } = await supabase
      .from('mr_procurement')
      .select('unitPrice, created_at')
      .ilike('materialName', `%${baseMaterialName}%`)
      .gt('unitPrice', 0)
      .neq('id', id || -1)
      .order('created_at', { ascending: false })
      .limit(5);

    if (pastOrders && pastOrders.length > 0) {
      const validPrices = pastOrders.map(p => Number(p.unitPrice) || 0).filter(p => p > 0);
      if (validPrices.length > 0) {
        const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
        pricingTrendContext = `The average historical price for this material over the last ${validPrices.length} orders was $${avgPrice.toFixed(2)}.`;
      }
    }

    // 3. Build the intelligence prompt for Gemini
    const prompt = `
      You are an expert AI Procurement Manager.
      Analyze this new Material Request (MR):
      
      --- REQUEST DETAILS ---
      MR Number: ${mr_no || 'Unknown'}
      Project: ${project_name} (Code: ${project_code})
      Delivery Site: ${site_name} (Code: ${site_code})
      Material Requested: ${material_name}
      Quantity: ${quantity}
      Required Date: ${required_date}
      Remarks/Details: ${remarks || 'None'}

      --- MASTER DATABASE RULES & HISTORY ---
      Auto-Assigned Vendor: ${approvedVendor}
      Auto-Assigned Price: $${standardPrice}
      Historical Pricing: ${pricingTrendContext}
      Site Order History: ${historyText}

      --- YOUR TASKS ---
      1. Vendor & Price Setup: We have automatically assigned this material request to our official vendor (${approvedVendor}) at our standard price ($${standardPrice}).
      2. Unapproved Items Rule: If the Auto-Assigned Vendor is 'Unknown (No Master Record)', you MUST flag ai_risk_level as 'High' and ai_recommendation as 'Reject' because it is an unauthorized material.
      3. Predict Stock Shortages & Hoarding: If the material IS approved, you must automatically Approve this request unless it seems like massive stock hoarding. Based on the Quantity, Required Date, and Site Order History, predict if this is an urgent stock shortage. If it is an emergency, flag priority as Critical.
      4. Analyze Pricing Trend: Compare the Auto-Assigned Price against the Historical Pricing context. Output a short insight on whether prices are rising, falling, or stable.

      Output ONLY a valid JSON object matching this schema exactly:
      {
        "ai_risk_level": "High" | "Medium" | "Low",
        "ai_priority": "Critical" | "Normal",
        "ai_recommendation": "Approve" | "Reject",
        "ai_reason": "You MUST format the first two lines EXACTLY as follows:\nVendor: [Vendor Name]\nPrice: $[Price]\n\nThen provide a 1-2 sentence explanation of any shortage predictions.",
        "ai_pricing_trend": "String detailing the % difference or stating prices are stable.",
        "ai_email_draft": "Draft a very brief, professional 1-2 sentence email introduction asking for a quote. Do NOT list the material specifications in the email body, just tell them to review the attached PDF RFQ document.",
        "ai_recommended_vendor": "State the Official Approved Vendor from the rules above.",
        "ai_professional_rfq_specifications": "Take the user's short remarks and expand them into a highly detailed, professional 3-to-5 point technical specification list for the RFQ PDF."
      }
    `;

    // 2. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.procurement,
        responseMimeType: 'application/json' 
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // 3. Save the AI intelligence back to the Supabase database
    // *NOTE: Replace 'procurement' with the exact name of your Supabase table if it is different!
    const { error } = await supabase
      .from('mr_procurement') 
      .update({
        supplierName: approvedVendor,
        unitPrice: parseFloat(standardPrice) || 0.00,
        agent_status: 'pending_manager_review',
        agent_metadata: aiAnalysis
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed. Make sure your Supabase table has these ai_ columns!", error);
      throw error;
    }



    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Procurement Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
