import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw procurement request data from the Android app
    const { id, item_name, quantity, site, required_date, notes } = data;

    // 1. Build the intelligence prompt for Gemini
    const prompt = `
      You are analyzing a new Material Request (MR).
      Item Requested: ${item_name || 'Unknown'}
      Quantity: ${quantity || 'Unknown'}
      Construction Site: ${site || 'Unknown'}
      Required By Date: ${required_date || 'Unknown'}
      Additional Notes: ${notes || 'None'}

      Evaluate the priority and risk of this request. Predict if this could cause a stock shortfall or budget issue.
      Output ONLY a valid JSON object matching this schema exactly:
      {
        "ai_risk_level": "High" | "Medium" | "Low",
        "ai_priority": "Critical" | "Normal",
        "ai_recommendation": "Approve" | "Reject",
        "ai_reason": "A 1-sentence explanation of your reasoning as a Procurement Officer."
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
        ai_reason: aiAnalysis.ai_reason
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
