import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import { sendTestTelegramDocument } from '@/lib/telegram';

function createPdfBuffer(mr_no: string, supplier: string, project_name: string, project_code: string, site_name: string, specifications: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Request For Quotation (RFQ)', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`RFQ Reference: RFQ-${mr_no}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`To: ${supplier}`, 20, 70);
    doc.text(`Project: ${project_name} (Code: ${project_code})`, 20, 80);
    doc.text(`Delivery Site: ${site_name}`, 20, 90);
    doc.setFontSize(14);
    doc.text('Material Specifications:', 20, 110);
    doc.setFontSize(12);
    const splitMaterialText = doc.splitTextToSize(specifications || 'General Construction Materials', 170);
    doc.text(splitMaterialText, 20, 120);
    const nextY = 120 + (splitMaterialText.length * 6) + 10;
    const footerText = doc.splitTextToSize('Please provide your best quotation for the requested materials listed above. Ensure that delivery timelines, payment terms, and validity of the quote are stated clearly in your response.', 170);
    doc.text(footerText, 20, nextY);
    doc.setFontSize(10);
    doc.text('Authorized by: 10xWorkforce Human Manager', 190, nextY + 30, { align: 'right' });
    const arrayBuffer = doc.output('arraybuffer');
    resolve(Buffer.from(arrayBuffer));
  });
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    
    // Fetch the procurement record
    const { data: item } = await supabase.from('mr_procurement').select('*').eq('id', id).single();
    if (!item) throw new Error("Item not found");

    const mr_no = item.mrNo || item.mr_no || 'Unknown';
    const supplier = item.supplierName || item.supplier || 'UnknownVendor';
    const project_name = item.projectName || item.site || 'Unknown';
    const project_code = item.projectCode || item.project_code || 'Unknown';
    const site_name = item.siteName || item.site_name || 'Unknown';
    // AI might not have saved specifications to DB directly, so fallback to remarks
    const specifications = item.ai_reason || item.remarks || '';
    const emailDraft = item.ai_email_draft || "Please see the attached RFQ for our upcoming material requirements.";

    const pdfBuffer = await createPdfBuffer(mr_no, supplier, project_name, project_code, site_name, specifications);
    const vendorEmail = `sales@${supplier.toLowerCase().replace(/\s+/g, '')}.com`;
    
    await sendTestTelegramDocument(
      vendorEmail,
      `RFQ-${mr_no} - Request for Quotation`,
      emailDraft,
      pdfBuffer,
      `RFQ-${mr_no}.pdf`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Approve Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
