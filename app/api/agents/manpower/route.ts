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
    const id = data.id;
    const site_code = data.projectCode || data.siteNo || 'Unknown';
    const site_name = data.projectName || data.siteName || 'Unknown';
    const engineer_name = data.engineerName || data.engineer || 'Unknown';
    const foreman_name = data.foremanName || data.foreman || 'Unknown';
    const other_staff = data.otherStaffCount || data.otherStaff || '0';
    const task_title = data.title || 'General Works';
    const startTime = data.startTime || 'Unknown';
    const endTime = data.endTime || 'Unknown';
    const location = data.location || 'Unknown';

    // 1. Fetch Company Rulebook (Master Tables)
    let requiredWorkerCount = 0;
    const { data: siteMaster } = await supabase
      .from('sites')
      .select('required_worker_count')
      .eq('site_code', site_code)
      .single();

    if (siteMaster && siteMaster.required_worker_count) {
      requiredWorkerCount = siteMaster.required_worker_count;
    }

    let foremanSkill = 'Unknown';
    const { data: foremanData } = await supabase
      .from('employees')
      .select('trade_skill')
      .eq('full_name', foreman_name)
      .single();
      
    if (foremanData) {
      foremanSkill = foremanData.trade_skill || 'Unknown';
    }

    // 2. Build the intelligence prompt
    const prompt = `
      You are a Daily Manpower AI Agent analyzing construction workforce logs.
      
      --- MANPOWER ALLOCATION FORM ---
      Task Title: ${task_title}
      Site: ${site_code} - ${site_name} (${location})
      Shift: ${startTime} to ${endTime}
      Assigned Foreman: ${foreman_name}
      Other Staff Allocated: ${other_staff}

      --- COMPANY RULEBOOK (Supabase Data) ---
      1. Site Demand: ${site_name} officially requires ${requiredWorkerCount} total workers to operate efficiently.
      2. Foreman Skill: According to the employee database, ${foreman_name}'s official trade is "${foremanSkill}".

      --- YOUR TASKS ---
      1. Match skills to tasks/sites: Check if the Assigned Foreman's official trade (${foremanSkill}) makes sense for the Task Title (${task_title}). If it is a severe mismatch (e.g., Plumber doing Electrical), flag it as Poor Allocation.
      2. Predict workforce demand & Auto-allocate: Compare the 'Other Staff Allocated' against the official 'Site Demand' (${requiredWorkerCount}). If they are severely understaffed, you MUST 'Recommend Subcontracting' and actively suggest how many subcontractors are needed in the reasoning.
      3. Optimize overtime: Check if the Shift duration is dangerously long (e.g. over 12 hours).
      
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
