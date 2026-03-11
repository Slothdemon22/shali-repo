import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, question, comments } = await request.json();

    if (!email || !question) {
      return NextResponse.json(
        { error: 'Email and question are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json(
        { error: 'Email service not configured.' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Use your verified zalnex.me domain as the sender
        from: 'Shali Newsletter <newsletter@zalnex.me>',
        to: 'www.basilslothdemon@gmail.com',
        subject: 'New Newsletter Question from Shali Site',
        text: [
          `Email: ${email}`,
          '',
          'Question:',
          question,
          '',
          comments ? `Comments:\n${comments}` : '',
        ].join('\n'),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend API error', res.status, body);
      return NextResponse.json(
        { error: 'Failed to send message via email provider.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter send error', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

