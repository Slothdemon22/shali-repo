import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.price || !data.categoryId || !data.image) {
      return NextResponse.json({ error: 'Name, price, category, and showcase image are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        badge: data.badge || null,
        description: data.description || null,
        categoryId: parseInt(data.categoryId),
        image: data.image,
        gallery: data.gallery || [],
        sku: data.sku || null,
        fabric: data.fabric || null,
        color: data.color || null,
        sizes: data.sizes || ["XS", "S", "M", "L", "XL"],
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
