import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/questions/[id] - Get single question
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            job: { select: { id: true, title: true, slug: true, icon: true } },
          },
        },
        _count: { select: { answers: true } },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'السؤال مش موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السؤال' },
      { status: 500 }
    );
  }
}

// PATCH /api/questions/[id] - Update question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, type, placeholder, options, isRequired, isGlobal, sortOrder, jobIds } = body;

    const data: Record<string, unknown> = {};
    if (text !== undefined) data.text = text;
    if (type !== undefined) data.type = type;
    if (placeholder !== undefined) data.placeholder = placeholder || null;
    if (options !== undefined) data.options = options;
    if (isRequired !== undefined) data.isRequired = isRequired;
    if (isGlobal !== undefined) data.isGlobal = isGlobal;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const question = await prisma.question.update({
      where: { id },
      data,
    });

    // Update job links if provided
    if (jobIds !== undefined) {
      // Remove old links
      await prisma.jobQuestion.deleteMany({ where: { questionId: id } });

      if (isGlobal || body.isGlobal) {
        // Link to all jobs
        const allJobs = await prisma.job.findMany({ select: { id: true } });
        for (const job of allJobs) {
          await prisma.jobQuestion.create({
            data: { jobId: job.id, questionId: id, sortOrder: sortOrder || 0 },
          });
        }
      } else if (Array.isArray(jobIds) && jobIds.length > 0) {
        for (const jobId of jobIds) {
          await prisma.jobQuestion.create({
            data: { jobId, questionId: id, sortOrder: sortOrder || 0 },
          });
        }
      }
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث السؤال' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete question
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف السؤال' },
      { status: 500 }
    );
  }
}
