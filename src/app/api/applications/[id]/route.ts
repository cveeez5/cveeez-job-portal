import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/applications/[id] - Get single application
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        answers: {
          include: {
            question: true,
          },
        },
        files: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'الطلب مش موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الطلب' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application status/notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const data: Record<string, string> = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const application = await prisma.application.update({
      where: { id },
      data,
      include: {
        job: { select: { title: true, slug: true } },
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الطلب' },
      { status: 500 }
    );
  }
}
