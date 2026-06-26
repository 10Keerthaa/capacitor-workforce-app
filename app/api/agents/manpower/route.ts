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
    const driver = data.driver || 'None';
    const other_staff = data.otherStaff || data.otherStaffName || 'None';
    const other_staff_trade = data.otherStaffTrade || data.otherStaffTradeSkill || 'Unknown';
    const task_title = data.taskTitle || 'General Works';
    const startTime = data.startTime || 'Unknown';
    const endTime = data.endTime || 'Unknown';
    const location = data.location || 'Unknown';
    const logType = data.logType || 'Unknown Log Type';
    const remarks = data.remarks || 'No remarks provided';

    // 1. Check if this is a Morning Check-In
    if (logType === 'Morning Check-In') {
      // Bypass AI and Manager Approval. Auto-approve to update Dashboard instantly.
      const { error } = await supabase
        .from('daily_manpower') 
        .update({
          agent_status: 'approved',
          agent_metadata: { 
            ai_reasoning: 'Morning Check-In automatically logged and approved. AI will run full analysis upon Evening Check-Out.',
            ai_overtime_risk: 'Safe',
            ai_allocation_efficiency: 'Optimal',
            ai_subcontract_recommendation: 'Maintain Internal Staff'
          }
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, bypassed: true });
    }

    // 2. Fetch Company Rulebook (Master Tables)
    let requiredWorkerCount = 0;
    const { data: siteMaster } = await supabase
      .from('sites')
      .select('required_manpower')
      .eq('site_code', site_code)
      .single();

    if (siteMaster && siteMaster.required_manpower) {
      requiredWorkerCount = siteMaster.required_manpower;
    }

    let foremanSkill = 'Unknown';
    const { data: foremanData } = await supabase
      .from('master_employees')
      .select('trade')
      .eq('employee_name', foreman_name)
      .single();
      
    if (foremanData) {
      foremanSkill = foremanData.trade || 'Unknown';
    }

    // 3. Build the intelligence prompt for Evening Check-Out
    const prompt = `
      You are a Daily Manpower AI Agent analyzing construction workforce logs.
      
      --- MANPOWER ALLOCATION FORM ---
      Log Type: ${logType}
      Task Title: ${task_title}
      Site: ${site_code} - ${site_name} (${location})
      Shift: ${startTime} to ${endTime}
      Team Allocated: 
        - Engineer: ${engineer_name}
        - Foreman: ${foreman_name}
        - Driver: ${driver}
        - Other Staff: ${other_staff} (Trade: ${other_staff_trade})
      Remarks / Issues (Evening Check-Out only): ${remarks}

      --- COMPANY RULEBOOK (Supabase Data) ---
      1. Site Demand: ${site_name} officially requires ${requiredWorkerCount} total workers to operate efficiently.
      2. Foreman Skill: According to the employee database, ${foreman_name}'s official trade is "${foremanSkill}".

      --- YOUR TASKS ---
      Analyze the Evening Check-Out data:
      1. Read the Remarks VERY CAREFULLY. If the remarks mention ANY delays, broken tools, missing materials, or issues (e.g., 'delayed by rain', 'crane broke'), you MUST flag 'ai_allocation_efficiency' as 'Poor Allocation' to ensure the Master Supervisor gets an alert.
      2. Check if the Shift duration is dangerously long (e.g. over 12 hours) to optimize overtime.
      3. Check if the 'Other Staff' trade (${other_staff_trade}) makes sense for the Task Title (${task_title}). If it is a severe mismatch (e.g., Plumber doing Electrical), flag it as Poor Allocation.
      4. If the team is severely understaffed compared to the official 'Site Demand', you MUST 'Recommend Subcontracting'.
      
    `;

    // 4. Call the Google Gen AI SDK
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

    // 5. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('daily_manpower') 
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
    console.error("Manpower Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
