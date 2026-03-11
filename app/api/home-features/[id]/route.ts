import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.homeFeature.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();

    const feature = await prisma.homeFeature.update({
      where: { id },
      data: {
        title: data.title,
        image: data.image,
        order: data.order !== undefined ? parseInt(data.order) : undefined,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      },
    });
    return NextResponse.json(feature);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}
