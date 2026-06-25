import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_productivity_trend: {
      type: Type.STRING,
      description: "Must be exactly 'Excellent', 'Acceptable', or 'Low'",
    },
    ai_bottleneck_identified: {
      type: Type.STRING,
      description: "Must be exactly 'High Risk', 'Medium Risk', or 'Low Risk' of a bottleneck.",
    },
    ai_delay_prediction: {
      type: Type.STRING,
      description: "Predict if this will cause a project delay. Use 'Delay Likely', 'Minor Delay', or 'On Track'.",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
  },
  required: ["ai_productivity_trend", "ai_bottleneck_identified", "ai_delay_prediction", "ai_reasoning"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw work output data from the Android app using camelCase matching the frontend
    const { id, technicianName, trade, workDescription, unitOfMeasure, outputPerDay, projectName } = data;

    // 1. Build the intelligence prompt for Gemini
    const prompt = `
      You are evaluating a daily work output log:
      Technician: ${technicianName || 'Unknown'}
      Trade: ${trade || 'Unknown'}
      Site: ${projectName || 'Unknown'}
      Work Performed: ${workDescription || 'Unknown'}
      Unit of Measure: ${unitOfMeasure || 'Unknown'}
      Output Achieved Today (8 hr shift): ${outputPerDay || 0}

      Analyze if this output is reasonable for a standard 8-hour construction shift. 
      Identify if there is a severe bottleneck (e.g., if the output is abnormally low, something prevented them from working).
      Predict if this trend will cause project delays.
      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 2. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.operations,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // Map specific AI keys to the unified dashboard schema
    const dashboardMetadata = {
      ...aiAnalysis,
      category: aiAnalysis.ai_productivity_trend,
      ai_risk_level: aiAnalysis.ai_delay_prediction === 'Delay Likely' ? 'Critical' : aiAnalysis.ai_delay_prediction === 'Minor Delay' ? 'Medium' : 'Low',
      fraud_risk: aiAnalysis.ai_bottleneck_identified === 'High Risk' ? 'High' : 'Low',
      reason: aiAnalysis.ai_reasoning
    };

    // 3. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('work_output') 
      .update({
        agent_status: 'pending_manager_review',
        agent_metadata: dashboardMetadata
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Work Output Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
