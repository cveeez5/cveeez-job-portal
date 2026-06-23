import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/questions - Get all questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobSlug = searchParams.get('job');
    const globalOnly = searchParams.get('global') === 'true';

    const where: Record<string, unknown> = {};

    if (globalOnly) {
      where.isGlobal = true;
    }

    if (jobSlug) {
      where.jobs = { some: { job: { slug: jobSlug } } };
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        jobs: {
          include: {
            job: { select: { id: true, title: true, slug: true, icon: true } },
          },
        },
        _count: { select: { answers: true } },
      },
      orderBy: [{ isGlobal: 'desc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({ data: questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الأسئلة' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, type, placeholder, options, isRequired, isGlobal, sortOrder, jobIds } = body;

    if (!text || !type) {
      return NextResponse.json(
        { error: 'نص السؤال ونوعه مطلوبين' },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        text,
        type,
        placeholder: placeholder || null,
        options: options || [],
        isRequired: isRequired || false,
        isGlobal: isGlobal || false,
        sortOrder: sortOrder || 0,
      },
    });

    // Link to jobs
    if (isGlobal) {
      // Link to all jobs
      const allJobs = await prisma.job.findMany({ select: { id: true } });
      for (const job of allJobs) {
        await prisma.jobQuestion.create({
          data: { jobId: job.id, questionId: question.id, sortOrder: sortOrder || 0 },
        });
      }
    } else if (jobIds && Array.isArray(jobIds) && jobIds.length > 0) {
      for (const jobId of jobIds) {
        await prisma.jobQuestion.create({
          data: { jobId, questionId: question.id, sortOrder: sortOrder || 0 },
        });
      }
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء السؤال' },
      { status: 500 }
    );
  }
}
