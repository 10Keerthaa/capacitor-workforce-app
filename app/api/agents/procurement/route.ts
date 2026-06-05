import { NextResponse } from 'next/server';
import { ai, AGENT_INSTRUCTIONS } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import PDFDocument from 'pdfkit';
import { sendTestTelegramDocument } from '@/lib/telegram';

// Helper to generate a PDF in-memory as a Buffer
function createPdfBuffer(mr_no: string, supplier: string, site: string, remarks: string, itemDescription: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Draw the PDF
    doc.fontSize(24).font('Helvetica-Bold').text('Request For Quotation (RFQ)', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(12).font('Helvetica-Bold').text('RFQ Reference: ', { continued: true }).font('Helvetica').text(`RFQ-${mr_no}`);
    doc.font('Helvetica-Bold').text('Date: ', { continued: true }).font('Helvetica').text(new Date().toLocaleDateString());
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('To: ', { continued: true }).font('Helvetica').text(supplier);
    doc.font('Helvetica-Bold').text('Delivery Site: ', { continued: true }).font('Helvetica').text(site);
    doc.moveDown(2);
    
    doc.font('Helvetica-Bold').text('Material Specifications:');
    doc.font('Helvetica').text(itemDescription || remarks || 'General Construction Materials');
    doc.moveDown(2);
    
    doc.text('Please provide your best quotation for the requested materials listed above. Ensure that delivery timelines, payment terms, and validity of the quote are stated clearly in your response.');
    doc.moveDown(3);
    
    doc.font('Helvetica-Oblique').text('Authorized by: 10xWorkforce AI Procurement Agent', { align: 'right' });
    
    doc.end();
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
        "ai_email_draft": "If Approved, draft a professional email to the vendor asking for a quote. If Rejected, leave empty."
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
        ai_reason: aiAnalysis.ai_reason
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
      const pdfBuffer = await createPdfBuffer(safeMrNo, safeSupplier, site || 'Unknown', remarks || '', data.item_description || '');
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
