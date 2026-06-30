import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "No image URL provided" }, { status: 400 });
    }

    // Fetch the image from the public URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch image from URL" }, { status: 400 });
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

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
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
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
