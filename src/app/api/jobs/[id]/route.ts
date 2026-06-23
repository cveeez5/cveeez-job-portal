import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/jobs/[id] - Get single job with questions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'الوظيفة مش موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الوظيفة' },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, titleEn, description, icon, isActive, sortOrder } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (titleEn !== undefined) data.titleEn = titleEn;
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const job = await prisma.job.update({
      where: { id },
      data,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الوظيفة' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الوظيفة' },
      { status: 500 }
    );
  }
}
