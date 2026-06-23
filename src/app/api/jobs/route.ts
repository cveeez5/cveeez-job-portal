import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/jobs - Get all jobs
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        _count: { select: { applications: true, questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الوظائف' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, titleEn, slug, description, icon, isActive, sortOrder } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'اسم الوظيفة والـ slug مطلوبين' },
        { status: 400 }
      );
    }

    const existing = await prisma.job.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'الـ slug ده موجود بالفعل' },
        { status: 409 }
      );
    }

    const job = await prisma.job.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug,
        description: description || null,
        icon: icon || '💼',
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الوظيفة' },
      { status: 500 }
    );
  }
}
