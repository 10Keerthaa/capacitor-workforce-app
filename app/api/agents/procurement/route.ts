import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import { sendTestTelegramDocument } from '@/lib/telegram';

// Helper to generate a PDF in-memory as a Buffer
function createPdfBuffer(mr_no: string, supplier: string, site: string, specifications: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    
    // Draw the PDF
    doc.setFontSize(22);
    doc.text('Request For Quotation (RFQ)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`RFQ Reference: RFQ-${mr_no}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    
    doc.text(`To: ${supplier}`, 20, 70);
    doc.text(`Delivery Site: ${site}`, 20, 80);
    
    doc.setFontSize(14);
    doc.text('Material Specifications:', 20, 100);
    
    doc.setFontSize(12);
    // Wrap text so it doesn't run off the page
    const splitMaterialText = doc.splitTextToSize(specifications || 'General Construction Materials', 170);
    doc.text(splitMaterialText, 20, 110);
    
    const footerText = doc.splitTextToSize('Please provide your best quotation for the requested materials listed above. Ensure that delivery timelines, payment terms, and validity of the quote are stated clearly in your response.', 170);
    doc.text(footerText, 20, 160);
    
    doc.setFontSize(10);
    doc.text('Authorized by: 10xWorkforce AI Procurement Agent', 190, 280, { align: 'right' });
    
    const arrayBuffer = doc.output('arraybuffer');
    resolve(Buffer.from(arrayBuffer));
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw procurement request data from the Android app
    const { id, mr_no, supplier, unit_price, site, remarks } = data;
    
    // Extract new fields from the Quick Fill / Android update
    const material_name = data.materialName || data.material_name || data.title || 'Unknown Material';
    const quantity = data.quantity || 'Unknown';
    const required_date = data.requiredDate || data.required_date || 'Unknown';
    const projectName = data.projectName || site || 'Unknown';

    // 1. Fetch "Rulebook" from materials_master
    let approvedVendor = 'Unknown (No Master Record)';
    let standardPrice = 'Unknown';
    const { data: materialMaster } = await supabase
      .from('materials_master')
      .select('approved_vendor, standard_price')
      .eq('material_name', material_name)
      .single();

    if (materialMaster) {
      approvedVendor = materialMaster.approved_vendor || approvedVendor;
      standardPrice = materialMaster.standard_price?.toString() || standardPrice;
    }

    // 2. Fetch Historical Context for Stock Shortage Prediction
    let historyText = "No recent orders recorded for this site.";
    const { data: recentOrders } = await supabase
      .from('mr_procurement')
      .select('created_at')
      .eq('site', projectName)
      .neq('id', id || -1)
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentOrders && recentOrders.length > 0) {
      historyText = `This site has submitted ${recentOrders.length} MRs recently. Last order was on: ${new Date(recentOrders[0].created_at).toLocaleDateString()}`;
    }

    // 3. Build the intelligence prompt for Gemini
    const prompt = `
      You are an expert AI Procurement Manager.
      Analyze this new Material Request (MR):
      
      --- REQUEST DETAILS ---
      MR Number: ${mr_no || 'Unknown'}
      Construction Site: ${projectName}
      Material Requested: ${material_name}
      Quantity: ${quantity}
      Required Date: ${required_date}
      Requested Supplier: ${supplier || 'Unknown'}
      Requested Unit Price: $${unit_price || '0.00'}
      Remarks/Details: ${remarks || 'None'}

      --- MASTER DATABASE RULES & HISTORY ---
      Official Approved Vendor for this Material: ${approvedVendor}
      Standard Approved Price: $${standardPrice}
      Site Order History: ${historyText}

      --- YOUR TASKS ---
      1. Recommend Vendors: If the 'Requested Supplier' does not match the 'Official Approved Vendor', you must reject the request and recommend the official vendor.
      2. Compare Pricing Trends: Compare the 'Requested Unit Price' against the 'Standard Approved Price'. Flag high risk if it is significantly more expensive.
      3. Predict Stock Shortages: Based on the Quantity, Required Date, and Site Order History, predict if this is an urgent stock shortage or if the delivery date is unrealistic.

      Output ONLY a valid JSON object matching this schema exactly:
      {
        "ai_risk_level": "High" | "Medium" | "Low",
        "ai_priority": "Critical" | "Normal",
        "ai_recommendation": "Approve" | "Reject",
        "ai_reason": "A 1-2 sentence explanation of your reasoning covering Vendor, Price, and Shortage prediction.",
        "ai_email_draft": "If Approved, draft a professional email to the vendor asking for a quote. If Rejected, leave empty.",
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
        ai_risk_level: aiAnalysis.ai_risk_level,
        ai_priority: aiAnalysis.ai_priority,
        ai_recommendation: aiAnalysis.ai_recommendation,
        ai_reason: aiAnalysis.ai_reason,
        ai_recommended_vendor: aiAnalysis.ai_recommended_vendor
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed. Make sure your Supabase table has these ai_ columns!", error);
      throw error;
    }

    // --- TELEGRAM PDF INTERCEPTOR ---
    if (aiAnalysis.ai_recommendation === 'Approve' && aiAnalysis.ai_email_draft) {
      const safeSupplier = supplier || 'UnknownVendor';
      const safeMrNo = mr_no || Math.floor(Math.random() * 1000).toString();
      const pdfBuffer = await createPdfBuffer(safeMrNo, safeSupplier, site || 'Unknown', aiAnalysis.ai_professional_rfq_specifications || remarks || '');
      const vendorEmail = `sales@${safeSupplier.toLowerCase().replace(/\s+/g, '')}.com`;
      
      await sendTestTelegramDocument(
        vendorEmail,
        `RFQ-${mr_no} - Request for Quotation`,
        aiAnalysis.ai_email_draft,
        pdfBuffer,
        `RFQ-${mr_no}.pdf`
      );
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Procurement Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
