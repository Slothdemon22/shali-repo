import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HERO_IMAGE_KEY = 'hero_image_url';

export async function GET() {
  try {
    const heroSetting = await prisma.siteSettings.findUnique({
      where: { key: HERO_IMAGE_KEY },
    });

    return NextResponse.json({
      success: true,
      heroImage: heroSetting?.value || null,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, message: 'Email and new password are required' }, { status: 400 });
    }

    // Look up the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Store new password as plain text (ordered by user)
    await prisma.user.update({
      where: { email },
      data: { password: newPassword }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { heroImage } = await request.json();

    if (!heroImage || typeof heroImage !== 'string') {
      return NextResponse.json({ success: false, message: 'A valid hero image URL is required' }, { status: 400 });
    }

    const saved = await prisma.siteSettings.upsert({
      where: { key: HERO_IMAGE_KEY },
      update: { value: heroImage },
      create: { key: HERO_IMAGE_KEY, value: heroImage },
    });

    return NextResponse.json({
      success: true,
      message: 'Hero image updated successfully',
      heroImage: saved.value,
    });
  } catch (error) {
    console.error('Hero image update error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
