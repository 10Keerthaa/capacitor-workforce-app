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
    const { id, tag_name, qty, returned_qty, item_name, brand, custody_task, status, warranty_details, purchase_date, photo_url, employee_name } = data;

    // 1. Fetch Worker History (Monitor Tool Usage Patterns)
    let workerHistoryContext = "No prior history of tool loss or discrepancies for this worker.";
    if (employee_name) {
      const { data: pastLosses } = await supabase
        .from('tools_mgmt')
        .select('id')
        .eq('employee_name', employee_name)
        .eq('ai_loss_risk', 'High Risk')
        .neq('id', id || -1); // Exclude the current record
        
      if (pastLosses && pastLosses.length > 0) {
        workerHistoryContext = `CRITICAL WARNING: This worker (${employee_name}) has a history of losing tools! They have been flagged for 'High Risk' of tool loss ${pastLosses.length} times previously.`;
      }
    }

    // 1. Build the intelligence prompt
    const prompt = `
      You are an Asset Controller Agent analyzing tool inventory.
      Item: ${brand || 'Unknown'} ${item_name || 'Unknown'}
      Tag: ${tag_name || 'Unknown'}
      Original Qty Checked Out: ${qty || 0}
      Qty Worker Claims to Return: ${returned_qty !== undefined ? returned_qty : 'Not provided'}
      Current Custody/Task: ${custody_task || 'Unassigned'}
      Condition Status: ${status || 'Unknown'}
      Warranty Details: ${warranty_details || 'Unknown'}
      Purchase Date (Epoch): ${purchase_date || 'Unknown'}

      Analyze if this tool is at risk of being lost/hoarded based on custody.
      Check if the tool is broken but under warranty.
      If a photo is provided, visually verify if the tools match the 'Qty Worker Claims to Return'.
      Compare the 'Qty Worker Claims to Return' against the 'Original Qty Checked Out'. If they don't match, or if the photo does not match, flag a High Risk of tool loss!
      
      --- WORKER HISTORY (THEFT DETECTIVE) ---
      ${workerHistoryContext}
      If the worker has a previous history of tool loss (Critical Warning), you MUST escalate the ai_loss_risk to 'High Risk' and explicitly recommend an immediate theft investigation in your reasoning.

      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 2. Handle Image Computer Vision (CV) if photo_url exists
    let contents: any[] = [{ text: prompt }];

    if (photo_url && photo_url.startsWith('http')) {
      try {
        const imageResponse = await fetch(photo_url);
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
      .from('tools_mgmt') 
      .update({
        ai_loss_risk: aiAnalysis.ai_loss_risk,
        ai_warranty_action: aiAnalysis.ai_warranty_action,
        ai_recommendation: aiAnalysis.ai_recommendation,
        ai_reasoning: aiAnalysis.ai_reasoning
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
