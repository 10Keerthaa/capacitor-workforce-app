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
    const data = await req.json();
    
    // The data payload contains a summarized list of all critical alerts across the platform
    const { 
      highRiskFinances, 
      criticalProcurements, 
      productivityBottlenecks, 
      absenteeismAlerts, 
      complianceGaps 
    } = data;

    const prompt = `
      You are the Master Supervisor AI Orchestrator for a global construction company.
      Your job is to look at the isolated alerts from 5 different AI Agents and find the correlations to create a company-wide strategy.
      
      ACTIVE ALERTS FROM SUB-AGENTS:
      Finance Agent: ${highRiskFinances}
      Procurement Agent: ${criticalProcurements}
      Operations Agent: ${productivityBottlenecks}
      Workforce Agent: ${absenteeismAlerts}
      HR Onboarding Agent: ${complianceGaps}

      Analyze how these issues connect. For example, if there is a material shortage AND low productivity at the same site, they are highly correlated.
      Determine the overall system status, identify the absolute biggest bottleneck, and create a cross-departmental action plan.
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
