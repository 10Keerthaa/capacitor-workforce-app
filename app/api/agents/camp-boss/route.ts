import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_absenteeism_risk: {
      type: Type.STRING,
      description: "Must be exactly 'High Risk', 'Medium Risk', or 'Low Risk'",
    },
    ai_replacement_action: {
      type: Type.STRING,
      description: "Action to take, e.g., 'Request Immediate Replacement', 'Monitor Situation', 'No Action Needed'",
    },
    ai_anomaly_detected: {
      type: Type.STRING,
      description: "Describe any anomalies, e.g., 'Possible contagion in room' or 'Normal absence'",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
  },
  required: ["ai_absenteeism_risk", "ai_replacement_action", "ai_anomaly_detected", "ai_reasoning"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw camp boss data
    const { id, employeeId, employeeName, campLocation, roomNumber, status, remarks, date } = data;

    // 1. Build the intelligence prompt
    const prompt = `
      You are a Workforce Agent (Camp Boss) analyzing labor camp attendance.
      Employee: ${employeeName || 'Unknown'} (${employeeId || 'Unknown'})
      Camp Location: ${campLocation || 'Unknown'}
      Room Number: ${roomNumber || 'Unknown'}
      Status: ${status || 'Unknown'}
      Remarks: ${remarks || 'None'}

      Analyze the worker's status and remarks to predict absenteeism risk.
      If the worker is sick or absent, determine if a replacement is needed on site.
      Detect any anomalies (e.g., if remarks suggest a contagious illness spreading).
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
      .from('camp_boss') 
      .update({
        ai_absenteeism_risk: aiAnalysis.ai_absenteeism_risk,
        ai_replacement_action: aiAnalysis.ai_replacement_action,
        ai_anomaly_detected: aiAnalysis.ai_anomaly_detected,
        ai_reasoning: aiAnalysis.ai_reasoning
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Camp Boss Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
