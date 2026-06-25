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

    // 1. Build the intelligence prompt
    const prompt = `
      You are an Asset Controller Agent analyzing tool inventory.
      Item: ${brand || 'Unknown'} ${itemName || 'Unknown'}
      Tag: ${tagName || 'Unknown'}
      Original Qty Checked Out: ${quantity || 0}
      Qty Worker Claims to Return: ${returnedQty !== undefined ? returnedQty : 'Not provided'}
      Current Custody/Task: ${assignedTo || 'Unassigned'}
      Condition Status: ${condition || 'Unknown'}
      Warranty Details: ${warrantyDetails || 'Unknown'}
      Purchase Date (Epoch): ${purchaseDate || 'Unknown'}

      Analyze if this tool is at risk of being lost/hoarded based on custody.
      Check if the tool is broken but under warranty.
      If a photo is provided, visually verify if the tools match the 'Qty Worker Claims to Return'.
      Compare the 'Qty Worker Claims to Return' against the 'Original Qty Checked Out'. If they don't match, or if the photo does not match, flag a High Risk of tool loss!
      
      --- WORKER HISTORY (THEFT DETECTIVE) ---
      ${workerHistoryContext}
      If the worker has a previous history of tool loss (Critical Warning), you MUST escalate the ai_loss_risk to 'High Risk' and explicitly recommend an immediate theft investigation in your reasoning.

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
