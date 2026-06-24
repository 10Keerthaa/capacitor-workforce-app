import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { Type, Schema } from '@google/genai';
import { sendTestTelegramMessage } from '@/lib/telegram';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ai_document_validation: {
      type: Type.STRING,
      description: "e.g., 'Valid Passport & Visa', 'Visa Expired', 'Missing Documents'",
    },
    ai_compliance_gap: {
      type: Type.STRING,
      description: "Describe any gaps, e.g., 'Visa expires in 10 days', 'No passport scan provided', 'Fully Compliant'",
    },
    ai_hr_action: {
      type: Type.STRING,
      description: "Action for HR, e.g., 'Send Warning to Renew Visa', 'Proceed with Onboarding', 'Halt Onboarding'",
    },
    ai_reasoning: {
      type: Type.STRING,
      description: "A 1-2 sentence explanation of your analysis.",
    },
    ai_email_draft: {
      type: Type.STRING,
      description: "If an action requires emailing the employee (e.g. for missing docs or visa expiry), draft the email message here. Otherwise, leave empty.",
    },
    ai_email_subject: {
      type: Type.STRING,
      description: "Subject of the email draft, if applicable.",
    },
    ai_sla_status: {
      type: Type.STRING,
      description: "Must be 'SLA Breached' if application is older than 3 days, or 'SLA Met'.",
    }
  },
  required: ["ai_document_validation", "ai_compliance_gap", "ai_hr_action", "ai_reasoning", "ai_email_draft", "ai_email_subject", "ai_sla_status"],
};

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw onboarding data
    const { id, employeeName, nationality, trade, passportExpiry, visaExpiry, passportScanUrisJson, date } = data;
    
    // Calculate current date for SLA
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // 1. Build the intelligence prompt
    const prompt = `
      You are an HR Onboarding Agent.
      Employee: ${employeeName || 'Unknown'}
      Nationality: ${nationality || 'Unknown'}
      Trade: ${trade || 'Unknown'}
      Passport Expiry (Epoch): ${passportExpiry || 'Not provided'}
      Visa Expiry (Epoch): ${visaExpiry || 'Not provided'}
      Application Date: ${date || 'Not provided'}
      Today's Date: ${currentDate}

      Analyze the document expiry dates against the current date.
      Identify any compliance gaps (like missing expiry dates or upcoming expirations).
      If a passport scan is provided, visually verify if it looks valid.
      
      SLA RULE: The company allows a maximum of 3 days to complete onboarding. Compare the 'Application Date' to 'Today's Date'. If it has been more than 3 days, output 'SLA Breached'. Otherwise output 'SLA Met'.
      
      Recommend the next action for HR.
      Output ONLY a valid JSON object matching the exact schema provided.
    `;

    // 2. Handle Image Computer Vision (CV) if passport scan exists
    let contents: any[] = [{ text: prompt }];

    if (passportScanUrisJson) {
       try {
          const uris = JSON.parse(passportScanUrisJson);
          if (Array.isArray(uris) && uris.length > 0) {
             const firstUrl = uris[0];
             if (firstUrl && firstUrl.startsWith('http')) {
                const imageResponse = await fetch(firstUrl);
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Image = buffer.toString('base64');
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
                
                contents = [
                   { text: prompt },
                   { inlineData: { data: base64Image, mimeType } }
                ];
             }
          }
       } catch (err) {
         console.error("Failed to fetch passport image for CV:", err);
       }
    }

    // 3. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.workforce,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // 4. Save the AI intelligence back to the Supabase database
    const { error } = await supabase
      .from('employee_onboarding') 
      .update({
        ai_document_validation: aiAnalysis.ai_document_validation,
        ai_compliance_gap: aiAnalysis.ai_compliance_gap,
        ai_hr_action: aiAnalysis.ai_hr_action,
        ai_reasoning: aiAnalysis.ai_reasoning,
        ai_sla_status: aiAnalysis.ai_sla_status
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed.", error);
      throw error;
    }

    // --- TELEGRAM INTERCEPTOR TRIGGER ---
    if (aiAnalysis.ai_email_draft && aiAnalysis.ai_email_draft.length > 5) {
      // Simulate an email to the employee
      const recipient = data.employeeEmail || `${employeeName?.toLowerCase().replace(/\s+/g, '.') || 'employee'}@example.com`;
      await sendTestTelegramMessage(
        recipient, 
        aiAnalysis.ai_email_subject || "HR Alert: Document Action Required", 
        aiAnalysis.ai_email_draft
      );
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Onboarding Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
