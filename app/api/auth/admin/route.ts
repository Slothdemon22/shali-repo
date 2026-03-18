import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Using plain text comparison (ordered by user)
    const isMatch = password === user.password;

    if (isMatch) {
      // Set an HttpOnly cookie to simulate a session
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: 'admin_token',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      // Store email temporarily for settings change verification
      response.cookies.set({
        name: 'admin_email',
        value: email,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return response;
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return NextResponse.json(
      { success: false, message: 'Bad request' },
      { status: 400 }
    );
  }
}
