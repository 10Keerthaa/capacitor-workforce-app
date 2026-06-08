import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import { sendTestTelegramDocument } from '@/lib/telegram';

// Helper to generate a PDF in-memory as a Buffer
function createPdfBuffer(mr_no: string, supplier: string, site: string, specifications: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    
    // Draw the PDF
    doc.setFontSize(22);
    doc.text('Request For Quotation (RFQ)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`RFQ Reference: RFQ-${mr_no}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    
    doc.text(`To: ${supplier}`, 20, 70);
    doc.text(`Delivery Site: ${site}`, 20, 80);
    
    doc.setFontSize(14);
    doc.text('Material Specifications:', 20, 100);
    
    doc.setFontSize(12);
    // Wrap text so it doesn't run off the page
    const splitMaterialText = doc.splitTextToSize(specifications || 'General Construction Materials', 170);
    doc.text(splitMaterialText, 20, 110);
    
    const footerText = doc.splitTextToSize('Please provide your best quotation for the requested materials listed above. Ensure that delivery timelines, payment terms, and validity of the quote are stated clearly in your response.', 170);
    doc.text(footerText, 20, 160);
    
    doc.setFontSize(10);
    doc.text('Authorized by: 10xWorkforce AI Procurement Agent', 190, 280, { align: 'right' });
    
    const arrayBuffer = doc.output('arraybuffer');
    resolve(Buffer.from(arrayBuffer));
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Extract the raw procurement request data from the Android app
    const { id, mr_no, supplier, unit_price, site, remarks } = data;

    // 1. Build the intelligence prompt for Gemini
    const prompt = `
      You are analyzing a new Material Request (MR).
      MR Number: ${mr_no || 'Unknown'}
      Supplier: ${supplier || 'Unknown'}
      Unit Price: $${unit_price || '0.00'}
      Construction Site: ${site || 'Unknown'}
      Remarks/Details: ${remarks || 'None'}

      Evaluate the priority and risk of this request. Predict if this could cause a stock shortfall or budget issue.
      Output ONLY a valid JSON object matching this schema exactly:
      {
        "ai_risk_level": "High" | "Medium" | "Low",
        "ai_priority": "Critical" | "Normal",
        "ai_recommendation": "Approve" | "Reject",
        "ai_reason": "A 1-sentence explanation of your reasoning as a Procurement Officer.",
        "ai_email_draft": "If Approved, draft a professional email to the vendor asking for a quote. If Rejected, leave empty.",
        "ai_recommended_vendor": "Suggest a highly realistic, cheaper alternative dummy vendor name based on the requested materials.",
        "ai_professional_rfq_specifications": "Take the user's short remarks and expand them into a highly detailed, professional 3-to-5 point technical specification list for the RFQ PDF."
      }
    `;

    // 2. Call the Google Gen AI SDK
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: AGENT_INSTRUCTIONS.procurement,
        responseMimeType: 'application/json' 
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    const aiAnalysis = JSON.parse(responseText);

    // 3. Save the AI intelligence back to the Supabase database
    // *NOTE: Replace 'procurement' with the exact name of your Supabase table if it is different!
    const { error } = await supabase
      .from('mr_procurement') 
      .update({
        ai_risk_level: aiAnalysis.ai_risk_level,
        ai_priority: aiAnalysis.ai_priority,
        ai_recommendation: aiAnalysis.ai_recommendation,
        ai_reason: aiAnalysis.ai_reason,
        ai_recommended_vendor: aiAnalysis.ai_recommended_vendor
      })
      .eq('id', id);

    if (error) {
      console.error("Database update failed. Make sure your Supabase table has these ai_ columns!", error);
      throw error;
    }

    // --- TELEGRAM PDF INTERCEPTOR ---
    if (aiAnalysis.ai_recommendation === 'Approve' && aiAnalysis.ai_email_draft) {
      const safeSupplier = supplier || 'UnknownVendor';
      const safeMrNo = mr_no || Math.floor(Math.random() * 1000).toString();
      const pdfBuffer = await createPdfBuffer(safeMrNo, safeSupplier, site || 'Unknown', aiAnalysis.ai_professional_rfq_specifications || remarks || '');
      const vendorEmail = `sales@${safeSupplier.toLowerCase().replace(/\s+/g, '')}.com`;
      
      await sendTestTelegramDocument(
        vendorEmail,
        `RFQ-${mr_no} - Request for Quotation`,
        aiAnalysis.ai_email_draft,
        pdfBuffer,
        `RFQ-${mr_no}.pdf`
      );
    }

    return NextResponse.json({ success: true, ai_analysis: aiAnalysis });
  } catch (error: any) {
    console.error("Procurement Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
