import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    system_status: {
      type: Type.STRING,
      description: "Must be exactly 'CRITICAL', 'WARNING', or 'STABLE'",
    },
    key_bottleneck: {
      type: Type.STRING,
      description: "A 1-sentence summary of the biggest threat to the company right now.",
    },
    orchestrated_action_plan: {
      type: Type.STRING,
      description: "A detailed, step-by-step action plan containing all necessary steps required to resolve the bottleneck. You MUST separate each step with a newline character (\\n). Example: '1. First step...\\n2. Second step...'",
    },
    financial_impact_risk: {
      type: Type.STRING,
      description: "Must be exactly 'High Risk', 'Medium Risk', or 'Low Risk'",
    },
  },
  required: ["system_status", "key_bottleneck", "orchestrated_action_plan", "financial_impact_risk"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json(); // We still accept the request, but we ignore the frontend's blind summary

    // 1. Autonomous Data Sweep (The CEO checking the database directly)
    const { data: rawFinances } = await supabase.from('petty_cash').select('projectName, amount, description, agent_metadata');
    const finances = (rawFinances || []).filter(f => f.agent_metadata?.fraud_risk === 'High');

    const { data: rawProcurements } = await supabase.from('mr_procurement').select('projectName, supplierName, unitPrice, agent_metadata');
    const procurements = (rawProcurements || []).filter(p => p.agent_metadata?.ai_risk_level === 'High');

    const { data: rawManpower } = await supabase.from('daily_manpower').select('siteName, taskTitle, foreman, otherStaff, agent_metadata');
    const manpower = (rawManpower || []).filter(m => m.agent_metadata?.ai_allocation_efficiency === 'Poor Allocation');

    const { data: rawOperations } = await supabase.from('work_output').select('projectName, trade, workDescription, agent_metadata');
    const operations = (rawOperations || []).filter(o => o.agent_metadata?.ai_delay_prediction === 'Delay Likely');

    // NEW: Deep Historical Cross-Reference (Camp Boss + Manpower)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const { data: todayAbsences } = await supabase.from('camp_boss')
      .select('employeeName, status')
      .eq('date', today)
      .eq('status', 'Absent');

    const { data: yesterdayManpower } = await supabase.from('daily_manpower')
      .select('siteName, foreman, engineer, otherStaff')
      .eq('date', yesterday);

    const crossReferenceData = {
      today_absences: todayAbsences || [],
      yesterday_site_rosters: yesterdayManpower || []
    };

    const prompt = `
      You are the Master Supervisor AI Orchestrator for a global construction company.
      Your job is to look at the isolated alerts from different AI Agents and find the correlations to create a company-wide strategy.
      
      ACTIVE CRITICAL ALERTS FROM SUB-AGENTS (Direct Database Read):
      Finance Agent (High Risk Petty Cash): ${JSON.stringify(finances)}
      Procurement Agent (High Risk Supply Chain): ${JSON.stringify(procurements)}
      Workforce Agent (Poor Manpower Allocation): ${JSON.stringify(manpower)}
      Operations Agent (Delay Likely): ${JSON.stringify(operations)}

      DEEP HISTORICAL CROSS-REFERENCE (The "CEO" View):
      ${JSON.stringify(crossReferenceData)}

      Analyze how these issues connect by looking at the Site names (projectName / siteName) and personnel names. 
      For example, check the DEEP HISTORICAL CROSS-REFERENCE: If a key leader (Foreman or Engineer) from yesterday's roster is in today's absence list, they are missing today! This will directly cause severe bottlenecks at that specific site today. 
      Also check if there is a material shortage AND poor manpower allocation at the exact same site.
      Determine the overall system status, identify the absolute biggest bottleneck (prioritize missing leadership or double-spending), and create a cross-departmental action plan that includes schedule adjustments based on operations data.
      Output ONLY a valid JSON object matching the exact schema provided.
      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: "You are the Master Orchestrator CEO AI. You connect data silos and drive multi-agent collaboration.",
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // Save the Master Report to the database
    const { error } = await supabase
      .from('supervisor_reports') 
      .insert([{
        system_status: aiAnalysis.system_status,
        key_bottleneck: aiAnalysis.key_bottleneck,
        orchestrated_action_plan: aiAnalysis.orchestrated_action_plan,
        financial_impact_risk: aiAnalysis.financial_impact_risk
      }]);

    if (error) {
      console.error("Database insert failed.", error);
      throw error;
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Supervisor Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
