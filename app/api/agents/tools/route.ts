import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_loss_risk: {
      type: Type.STRING,
      description: "Must be exactly 'High Risk', 'Medium Risk', or 'Low Risk'",
    },
    ai_warranty_action: {
      type: Type.STRING,
      description: "Must be exactly 'Claim Warranty', 'Expired', or 'Active'",
    },
    ai_recommendation: {
      type: Type.STRING,
      description: "Action to take, e.g., 'Recall Tool', 'Investigate Missing Items', 'Safe'",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
  },
  required: ["ai_loss_risk", "ai_warranty_action", "ai_recommendation", "ai_reasoning"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw tools management data
    const { 
      id, 
      tagName, 
      quantity, 
      returnedQty, 
      itemName, 
      brand, 
      assignedTo, 
      condition, 
      warrantyDetails, 
      purchaseDate, 
      returnPhotoUrisJson,
      checkoutPhotoUrisJson
    } = data;

    // We need a single photo URL for CV if it exists. Prefer return photo, fallback to checkout photo.
    let photoUrl = null;
    if (returnPhotoUrisJson && returnPhotoUrisJson.length > 0) {
      photoUrl = returnPhotoUrisJson[0];
    } else if (checkoutPhotoUrisJson && checkoutPhotoUrisJson.length > 0) {
      photoUrl = checkoutPhotoUrisJson[0];
    }

    // 0. Fetch "Rulebook" from master_tools
    let toolBrand = brand || 'Unknown';
    let toolWarranty = warrantyDetails || 'Unknown';
    let toolPurchaseDate = purchaseDate || 'Unknown';
    let toolName = itemName || 'Unknown';

    if (tagName) {
      const { data: masterTool } = await supabase
        .from('master_tools')
        .select('brand, warranty_status, purchase_date, item_name')
        .eq('tag_name', tagName)
        .single();
        
      if (masterTool) {
         toolBrand = masterTool.brand || toolBrand;
         toolWarranty = masterTool.warranty_status || toolWarranty;
         toolPurchaseDate = masterTool.purchase_date || toolPurchaseDate;
         toolName = masterTool.item_name || toolName;
      }
    }

    // 1. Fetch Worker History (Monitor Tool Usage Patterns)
    let workerHistoryContext = "No prior history of tool loss or discrepancies for this worker.";
    if (assignedTo) {
      const { data: pastLosses } = await supabase
        .from('tools_management')
        .select('id, agent_metadata')
        .eq('assignedTo', assignedTo)
        .neq('id', id || -1); // Exclude the current record
        
      let highRiskCount = 0;
      if (pastLosses) {
        highRiskCount = pastLosses.filter(row => row.agent_metadata?.ai_loss_risk === 'High Risk').length;
      }

      if (highRiskCount > 0) {
        workerHistoryContext = `CRITICAL WARNING: This worker (${assignedTo}) has a history of losing tools! They have been flagged for 'High Risk' of tool loss ${highRiskCount} times previously.`;
      }
    }

    // 2. Build the intelligence prompt with Dual-Mode Logic (Check-Out vs Return)
    const isReturnEvent = returnedQty !== undefined && returnedQty !== null;

    const prompt = `
      You are an Asset Controller Agent analyzing tool inventory.
      Item: ${toolBrand} ${toolName}
      Tag: ${tagName || 'Unknown'}
      Original Qty Checked Out: ${quantity || 0}
      Current Custody/Task: ${assignedTo || 'Unassigned'}
      Condition Status: ${condition || 'Unknown'}
      Warranty Details: ${toolWarranty}
      Purchase Date (Epoch): ${toolPurchaseDate}
      Event Type: ${isReturnEvent ? 'TOOL RETURN' : 'TOOL CHECK-OUT'}

      --- WORKER HISTORY (THEFT DETECTIVE) ---
      ${workerHistoryContext}

      ANALYSIS RULES:
      1. Check if the tool is broken but under warranty.
      2. If Event Type is 'TOOL CHECK-OUT': Ignore return quantities. Focus ONLY on the Worker History. If they have a history of tool loss (Critical Warning), escalate ai_loss_risk to 'High Risk' and recommend an immediate manager override. If history is clean, risk is 'Low Risk'.
      3. If Event Type is 'TOOL RETURN': You are auditing the return. Compare 'Qty Worker Claims to Return' (${isReturnEvent ? returnedQty : 'N/A'}) against 'Original Qty Checked Out' (${quantity || 0}). If they do not match, or if the provided photo shows missing/broken items, flag 'High Risk' of tool loss!

      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 2. Handle Image Computer Vision (CV) if photoUrl exists
    let contents: any[] = [{ text: prompt }];

    if (photoUrl && photoUrl.startsWith('http')) {
      try {
        const imageResponse = await fetch(photoUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        contents = [
           { text: prompt },
           { inlineData: { data: base64Image, mimeType } }
        ];
      } catch (err) {
        console.error("Failed to fetch image for CV:", err);
      }
    }

    // 3. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.tools,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // 4. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('tools_management') 
      .update({
        agent_status: 'pending_manager_review',
        agent_metadata: aiAnalysis
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Tools Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
