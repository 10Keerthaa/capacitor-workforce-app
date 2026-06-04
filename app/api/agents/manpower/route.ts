import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_overtime_risk: {
      type: Type.STRING,
      description: "Must be exactly 'High Risk', 'Medium Risk', or 'Safe'",
    },
    ai_allocation_efficiency: {
      type: Type.STRING,
      description: "Must be exactly 'Poor Allocation', 'Fair Allocation', or 'Optimal'",
    },
    ai_subcontract_recommendation: {
      type: Type.STRING,
      description: "Must be exactly 'Recommend Subcontracting' or 'Maintain Internal Staff'",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
  },
  required: ["ai_overtime_risk", "ai_allocation_efficiency", "ai_subcontract_recommendation", "ai_reasoning"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw daily manpower data
    const { id, siteNo, siteName, location, startTime, endTime, engineer, foreman, otherStaff, date } = data;

    // 1. Build the intelligence prompt
    const prompt = `
      You are a Daily Manpower AI Agent analyzing construction workforce logs.
      Site: ${siteNo || 'Unknown'} - ${siteName || 'Unknown'} (${location || 'Unknown'})
      Shift Start: ${startTime || 'Unknown'}
      Shift End: ${endTime || 'Unknown'}
      Engineer: ${engineer || 'None'}
      Foreman: ${foreman || 'None'}
      Other Staff: ${otherStaff || '0'}

      Analyze if the duration between Start and End time indicates extreme overtime.
      Analyze if the ratio of leadership (Engineer/Foreman) to 'Other Staff' is safe and efficient.
      If overtime is extremely high and staff numbers are large, recommend subcontracting.
      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 2. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.workforce,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // 3. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('daily_manpower') 
      .update({
        ai_overtime_risk: aiAnalysis.ai_overtime_risk,
        ai_allocation_efficiency: aiAnalysis.ai_allocation_efficiency,
        ai_subcontract_recommendation: aiAnalysis.ai_subcontract_recommendation,
        ai_reasoning: aiAnalysis.ai_reasoning
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Manpower Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
