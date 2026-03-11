import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const features = await prisma.homeFeature.findMany({
      orderBy: { order: 'asc' },
      include: { category: true },
    });
    return NextResponse.json(features);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check limit
    const count = await prisma.homeFeature.count();
    if (count >= 3) {
      return NextResponse.json({ error: 'Limit reached (max 3 features allowed)' }, { status: 400 });
    }

    const feature = await prisma.homeFeature.create({
      data: {
        title: data.title,
        image: data.image,
        order: data.order ? parseInt(data.order) : 0,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      },
    });
    return NextResponse.json(feature);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
