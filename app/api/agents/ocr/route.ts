import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { imageUrl, imageUrls } = await request.json();
    
    const urlsToProcess = imageUrls || (imageUrl ? [imageUrl] : []);

    if (urlsToProcess.length === 0) {
      return NextResponse.json({ success: false, error: "No image URL provided" }, { status: 400 });
    }

    const imageParts: any[] = [];
    
    for (const url of urlsToProcess) {
      try {
        const imageResponse = await fetch(url);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      } catch (err) {
        console.error(`Failed to fetch image: ${url}`, err);
      }
    }

    if (imageParts.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to fetch image from URL(s)" }, { status: 400 });
    }

    const prompt = `
      You are an expert AI Receipt Data Extractor.
      Extract the following information from this receipt:
      - supplierName: The name of the store or vendor.
      - amount: The subtotal amount (before tax/VAT). If only a total is present, use that.
      - vat: The tax or VAT amount. If none, use 0.
      - totalAmount: The final total amount paid.
      - date: The date on the receipt in YYYY-MM-DD format.

      Return ONLY a raw JSON object with no markdown formatting. It must have exactly these keys:
      {
        "supplierName": "string",
        "amount": "number",
        "vat": "number",
        "totalAmount": "number",
        "date": "YYYY-MM-DD"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...imageParts,
        prompt
      ],
    });

    const aiText = response.text || "{}";
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("OCR Agent Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process receipt" }, { status: 500 });
  }
}
