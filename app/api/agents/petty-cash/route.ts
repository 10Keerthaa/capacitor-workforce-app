import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase'; // Assuming you created this file!

// Initialize the Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    // 1. Get the new petty cash claim from the request body
    const claimData = await request.json();
    const siteName = claimData.site || 'Unknown';
    const employeeName = claimData.employee_name || 'Unknown';

    // 2. FETCH CONTEXT FROM DATABASE (For Duplicates & Budgeting)
    
    // A. Check for potential duplicates by getting recent claims from this same employee
    let recentClaimsText = "No recent claims found.";
    const { data: recentClaims } = await supabase
      .from('petty_cash')
      .select('amount, description, created_at')
      .eq('pettyCashHolder', employeeName)
      .neq('id', claimData.id) // Exclude current
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentClaims && recentClaims.length > 0) {
      recentClaimsText = recentClaims.map(c => `- $${c.amount} for "${c.description}"`).join('\n');
    }

    // B. Calculate budget overruns (Mock monthly budget of $5000 per site)
    let totalSpentThisMonth = 0;
    const { data: siteClaims } = await supabase
      .from('petty_cash')
      .select('amount')
      .eq('projectName', siteName)
      .eq('status', 'approved');

    if (siteClaims) {
      totalSpentThisMonth = siteClaims.reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);
    }
    const budgetLimit = 5000;
    const remainingBudget = budgetLimit - totalSpentThisMonth;

    // 3. We use Gemini 3.5 Flash with FULL Context
    const prompt = `
      You are an expert AI Finance Controller (Petty Cash Agent).
      Analyze the following petty cash claim submitted by a field worker.
      
      --- CURRENT CLAIM ---
      Employee: ${employeeName}
      Amount: $${claimData.amount}
      Description: "${claimData.description}"
      Project/Site: ${siteName}

      --- HISTORICAL CONTEXT ---
      1. Employee's Recent Claims (Last few days):
      ${recentClaimsText}
      
      2. Site Budget Status:
      Total Spent This Month: $${totalSpentThisMonth}
      Monthly Budget Limit: $${budgetLimit}
      Remaining Budget Before This Claim: $${remainingBudget}

      --- YOUR TASKS ---
      Fulfill all 5 requirements of the Finance Agent:
      1. Auto-categorize the expense (e.g., Fuel, Materials, Food, Maintenance, Other).
      2. Detect duplicate/abnormal claims (Compare with their recent claims context above).
      3. Predict budget overruns (Warn if this pushes the remaining budget below $0 or dangerously close).
      4. Flag fraud patterns (e.g., is $500 for a pen abnormal? Is this amount suspiciously similar to a recent claim?).
      5. Recommend Approval, Rejection, or Escalation based on all the above.

      Provide a short 1-2 sentence reason for your recommendation.

      Return ONLY a raw JSON object with no markdown formatting. It must have exactly these keys:
      {
        "category": "string",
        "fraud_risk": "High" | "Medium" | "Low",
        "recommendation": "Approve" | "Reject" | "Escalate",
        "reason": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const aiText = response.text || "{}";
    
    // Clean up any markdown code blocks Gemini might accidentally add
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    // 4. Write the AI's decision back into Supabase!
    if (claimData.id) {
      const { error } = await supabase.from('petty_cash').update({ 
         ai_category: analysis.category,
         ai_fraud_risk: analysis.fraud_risk,
         ai_recommendation: analysis.recommendation,
         ai_reason: analysis.reason,
         // We removed the auto 'status' update to enforce Human-in-the-Loop!
      }).eq('id', claimData.id);

      if (error) console.error("Failed to update Supabase:", error);
    }

    return NextResponse.json({ success: true, agent_analysis: analysis });

  } catch (error) {
    console.error("Petty Cash Agent Error:", error);
    return NextResponse.json({ success: false, error: "Agent failed to analyze claim." }, { status: 500 });
  }
}
