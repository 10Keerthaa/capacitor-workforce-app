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
    
    // Extract the raw work output data from the Android app
    const { id, technician_name, trade, work_description, uom, output_per_day, site } = data;

    // 1. Fetch Cross-Site Intelligence (Compare Teams/Sites)
    let crossSiteContext = "No other site data available for comparison.";
    
    // Fetch recent work outputs from other sites for the exact same trade
    const { data: otherSitesData } = await supabase
      .from('work_output')
      .select('site, ai_productivity_trend')
      .eq('trade', trade || 'Unknown')
      .neq('site', site || 'Unknown')
      .neq('id', id || -1)
      .order('created_at', { ascending: false })
      .limit(10);

    if (otherSitesData && otherSitesData.length > 0) {
      // Find a site that is performing 'Excellent' to recommend shifting workers from
      const excellentSite = otherSitesData.find(row => row.ai_productivity_trend === 'Excellent');
      if (excellentSite) {
        crossSiteContext = `Cross-Site Analysis: The "${excellentSite.site}" project is currently operating with 'Excellent' productivity for this exact trade (${trade}).`;
      }
    }

    // 2. Build the intelligence prompt for Gemini
    const prompt = `
      You are evaluating a daily work output log:
      Technician: ${technician_name || 'Unknown'}
      Trade: ${trade || 'Unknown'}
      Site: ${site || 'Unknown'}
      Work Performed: ${work_description || 'Unknown'}
      Unit of Measure: ${uom || 'Unknown'}
      Output Achieved Today (8 hr shift): ${output_per_day || 0}

      --- CROSS-SITE INTELLIGENCE ---
      ${crossSiteContext}

      --- YOUR TASKS ---
      1. Analyze if this output is reasonable for a standard 8-hour construction shift. 
      2. Identify if there is a severe bottleneck (e.g., if the output is abnormally low, something prevented them from working).
      3. Predict if this trend will cause project delays.
      4. RECOMMEND MANPOWER SHIFTS: If you predict a Delay or High Risk Bottleneck for this site, AND the Cross-Site Intelligence shows another site is 'Excellent', you MUST add a sentence to your ai_reasoning recommending to temporarily shift workers from the excellent site to this struggling site.
      
      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 3. Call the Google Gen AI SDK
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

    // 4. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('work_output') 
      .update({
        ai_productivity_trend: aiAnalysis.ai_productivity_trend,
        ai_bottleneck_identified: aiAnalysis.ai_bottleneck_identified,
        ai_delay_prediction: aiAnalysis.ai_delay_prediction,
        ai_reasoning: aiAnalysis.ai_reasoning
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
