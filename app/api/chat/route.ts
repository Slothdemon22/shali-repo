import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Fetch context from DB - dynamic and more comprehensive
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ include: { category: true }, take: 100 }),
      prisma.category.findMany()
    ]);

    const systemPrompt = `
      You are "Shali Assistant", the exclusive AI concierge for Nishat Pret. 
      Your tone is sophisticated, knowledgeable, and helpful.

      LIVE SHOP CONTEXT:
      - CATEGORIES AVAILABLE: ${categories.map((c: any) => c.name).join(' | ')}
      - FULL PRODUCT CATALOG:
      ${products.map((p: any) => `* **${p.name}** - Category: ${p.category?.name} | Price: ${p.price} | SKU: ${p.sku || 'N/A'} | Fabric: ${p.fabric || 'Premium'} | Sizes: ${(p.sizes || []).join(', ')}`).join('\n      ')}

      INSTRUCTIONS:
      1. **Premium Markdown**: Always use markdown for your responses. Use **bold** for product names, *italics* for emphasis, and unordered lists for multiple items.
      2. **Concierge Service**: If a user asks for something not in the catalog, suggest a similar category or offer to connect them with our bespoke styling service.
      3. **Structure**: Keep responses concise and well-structured. Use headers if necessary (e.g. ### Featured Picks).
      4. **Price Formatting**: Always mention prices exactly as "PKR X,XXX".
      5. **Links**: You cannot provide direct links, but you can tell users to look in specific categories.
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
          ...messages
        ],
        temperature: 0.6,
        max_tokens: 800,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json();
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await groqResponse.json();
    return NextResponse.json({ message: data.choices[0].message.content });

  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
