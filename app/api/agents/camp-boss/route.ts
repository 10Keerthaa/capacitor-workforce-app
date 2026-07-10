import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';
import { sendTestTelegramMessage } from '@/lib/telegram';

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
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
    ai_worker_sms_draft: {
      type: Type.STRING,
      description: "A short, friendly SMS message to send directly to the worker regarding their status. You MUST provide the message in BOTH English AND their native language in the same text string.",
    },
    ai_worker_sms_language: {
      type: Type.STRING,
      description: "The language you translated the SMS into based on their nationality (e.g., 'Bilingual: English & Tagalog').",
    },
    ai_camp_utilization: {
      type: Type.STRING,
      description: "Must be 'Over Capacity Risk' (if occupancy is >90% of capacity) or 'Safe'.",
    }
  },
  required: ["ai_absenteeism_risk", "ai_replacement_action", "ai_reasoning", "ai_worker_sms_draft", "ai_worker_sms_language", "ai_camp_utilization"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw camp boss data
    const { id, employeeId, employeeName, campLocation, roomNumber, status, remarks, date } = data;

    // 1. Fetch Company Rulebook (Master Tables)
    let employeeNationality = 'Unknown';
    let employeeTrade = 'Unknown';
    let assignedSite = 'Unknown';
    let sitePriority = 'Unknown';

    if (employeeName && employeeName !== 'Unknown') {
      // Step 1: Look up employee in master_employees
      let empData = null;
      const { data: masterEmpData } = await supabase
        .from('master_employees')
        .select('*')
        .eq('employee_name', employeeName)
        .single();
      
      if (masterEmpData) {
         empData = masterEmpData;
      } else {
         const { data: oldEmpData } = await supabase
          .from('employees')
          .select('*')
          .eq('full_name', employeeName)
          .single();
         empData = oldEmpData;
      }

      if (empData) {
        employeeNationality = empData.nationality || 'Unknown';
        employeeTrade = empData.trade || empData.trade_skill || empData.designation || 'Unknown';
        assignedSite = empData.assigned_project || empData.current_site || empData.site_assigned || 'Unknown';

        // Step 2 & 3: Cross-reference the new Master Data tables for Priority
        if (assignedSite && assignedSite !== 'Unknown') {
           try {
             // Get parent project code from sites table
             const { data: siteData } = await supabase
               .from('sites')
               .select('parent_project_code')
               .eq('site_name', assignedSite)
               .single();
               
             if (siteData && siteData.parent_project_code) {
                // Get priority level from projects_master table
                const { data: projectData } = await supabase
                  .from('projects_master')
                  .select('priority_level')
                  .eq('project_code', siteData.parent_project_code)
                  .single();
                  
                if (projectData && projectData.priority_level) {
                   sitePriority = projectData.priority_level;
                }
             }
           } catch (e) {
             console.error("Master data priority lookup failed", e);
           }
        }
      }
    }

    // Fetch Camp Utilization Data
    let totalCapacity = 100; // Fallback
    let currentOccupancy = 0; // Fallback

    if (campLocation && campLocation !== 'Unknown') {
      const { data: campData } = await supabase
        .from('camps')
        .select('total_capacity, current_occupancy')
        .eq('camp_name', campLocation)
        .single();

      if (campData) {
        totalCapacity = campData.total_capacity || 100;
        currentOccupancy = campData.current_occupancy || 0;
      } else {
        // Fallback demo simulation if master table is empty for this camp
        currentOccupancy = 92; // High utilization for demo
      }
    }

    // 2. Build the intelligence prompt
    const prompt = `
      You are a Workforce Agent (Camp Boss) analyzing labor camp attendance.
      Employee: ${employeeName || 'Unknown'} (${employeeId || 'Unknown'})
      Trade/Skill: ${employeeTrade}
      Assigned Site: ${assignedSite} (Database Priority Level: ${sitePriority})
      Nationality: ${employeeNationality}
      Camp Location: ${campLocation || 'Unknown'}
      Room Number: ${roomNumber || 'Unknown'}
      Status: ${status || 'Unknown'}
      Remarks: ${remarks || 'None'}

      --- CAMP UTILIZATION DATA ---
      Total Bed Capacity: ${totalCapacity}
      Current Occupancy: ${currentOccupancy}

      --- SITE DEADLINE & PRIORITY RULES ---
      If the Assigned Site is a High-Priority project or has a tight deadline, AND the worker holds a critical Trade/Skill, you MUST escalate the action to 'Request Immediate Replacement' to prevent project delays regardless of the illness severity.

      Analyze the worker's status and remarks to predict absenteeism risk.
      If the worker is sick or absent, determine if a replacement is needed on site based on their role and priority.
      CRITICAL: Do NOT attempt to diagnose camp-wide contagions or outbreaks. Only assess the individual worker's absenteeism risk and site replacement needs.
      Calculate the Camp Utilization percentage (Current Occupancy / Total Capacity). If it is over 90%, flag 'Over Capacity Risk', otherwise 'Safe'.
      
      CRITICAL: Draft a Care SMS to send to the worker. 
      - If they are sick: "Get well soon, please visit the camp clinic."
      - If they are absent without reason: "Please report to the site immediately or contact the Camp Boss."
      TRANSLATE this SMS. You must provide the message in BOTH English AND the native language of their Nationality (${employeeNationality}). You MUST separate the English message and the native translation with a double newline (\\n\\n) so they appear on completely separate lines.
      
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
        agent_status: 'pending_manager_review',
        agent_metadata: aiAnalysis
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    // --- TELEGRAM INTERCEPTOR TRIGGER ---
    // Disabled temporarily per user request
    /*
    if (aiAnalysis.ai_worker_sms_draft && aiAnalysis.ai_worker_sms_draft.length > 3) {
      // Simulate sending an SMS to the worker's phone
      const phoneToUse = data.employeePhone || "+971-50-0000000";
      await sendTestTelegramMessage(
        phoneToUse, 
        `Camp Boss SMS Alert (${aiAnalysis.ai_worker_sms_language})`, 
        aiAnalysis.ai_worker_sms_draft
      );
    }
    */

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Camp Boss Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
