import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, availableCategories } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const categoriesPrompt = availableCategories && availableCategories.length > 0
      ? `Available categories: [${availableCategories.join(', ')}]. If the user explicitly mentions a category or something similar, pick the EXACT MATCHING name from this list. If not, infer the best fit from this list based on the product details. If none match, return an empty string.`
      : `The closest category name (e.g. "Pret", "Unstitched", "Luxury"). Guess if missing.`;

    const systemPrompt = `
You are an expert AI assistant that extracts product details from text and formats them as JSON.
The user will provide text describing a product.
You must extract the following fields and return ONLY a valid JSON object.

Required fields (if not provided in text, you MUST infer or generate a plausible value based on context):
- name (string): The product name.
- price (string): The price string (e.g. "Rs. 22,900"). Generate a realistic price if missing.
- sku (string): A unique SKU (e.g. "SK-123"). Generate one if missing.
- fabric (string): The fabric type. Infer or invent if missing.
- color (string): The color. Infer or invent if missing.
- description (string): A detailed product description. Write a compelling one if missing or too short.
- categoryName (string): ${categoriesPrompt}
- sizes (array of strings): Array of sizes, usually ["XS", "S", "M", "L", "XL"]. Default to this if missing.

Optional fields (ONLY fill if explicitly mentioned by the user. If not mentioned, return empty string ""):
- badge (string): An optional badge like "NEW IN", "SALE", etc.
- discountPrice (string): The discounted price if mentioned (e.g. "Rs. 18,000"). Leave blank if none.

Return ONLY valid JSON. No markdown formatting, no code blocks, just raw JSON string.
Example format:
{
  "name": "3 PIECE - EMBROIDERED SUIT",
  "price": "Rs. 22,900",
  "sku": "SK-123",
  "fabric": "Lawn, Silk",
  "color": "Midnight Black",
  "description": "A stunning 3 piece suit featuring delicate embroidery...",
  "badge": "NEW IN",
  "categoryName": "Unstitched",
  "sizes": ["XS", "S", "M", "L", "XL"]
}
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json();
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await groqResponse.json();
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown block if present
    if (content.startsWith('```json')) {
      content = content.substring(7);
    } else if (content.startsWith('```')) {
      content = content.substring(3);
    }
    if (content.endsWith('```')) {
      content = content.substring(0, content.length - 3);
    }
    content = content.trim();

    const parsedJson = JSON.parse(content);
    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error('AI Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
