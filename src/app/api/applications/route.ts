import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/cloudflare-r2';

export const dynamic = 'force-dynamic';

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const jobSlug = formData.get('jobSlug') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const city = formData.get('city') as string;
    const yearsOfExperience = formData.get('yearsOfExperience') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const answersJson = formData.get('answers') as string;
    const cvFile = formData.get('cv') as File | null;

    // Validate required fields
    if (!jobSlug || !name || !email) {
      return NextResponse.json(
        { error: 'الاسم والإيميل والوظيفة مطلوبين' },
        { status: 400 }
      );
    }

    // Find job by slug
    const job = await prisma.job.findUnique({
      where: { slug: jobSlug },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'الوظيفة مش موجودة' },
        { status: 404 }
      );
    }

    // Parse answers JSON
    let parsedAnswers: Record<string, string> | null = null;
    if (answersJson) {
      try {
        const answers = JSON.parse(answersJson) as Record<string, string>;
        const filtered = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v.trim() !== '')
        );
        if (Object.keys(filtered).length > 0) {
          parsedAnswers = filtered;
        }
      } catch {
        console.error('Error parsing answers JSON');
      }
    }

    // Create application with answers stored as JSON
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        name,
        email,
        phone: phone || null,
        city: city || null,
        yearsOfExperience: yearsOfExperience || null,
        linkedinUrl: linkedinUrl || null,
        answersJson: parsedAnswers ?? undefined,
      },
    });

    // Upload CV file if provided
    if (cvFile && cvFile.size > 0) {
      try {
        const uploadResult = await uploadToR2(cvFile, `cv/${jobSlug}`);

        await prisma.uploadedFile.create({
          data: {
            applicationId: application.id,
            fileName: uploadResult.fileName,
            fileKey: uploadResult.fileKey,
            fileUrl: uploadResult.fileUrl,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
          },
        });
      } catch (uploadError) {
        console.error('Error uploading CV:', uploadError);
        // Don't fail the whole application if upload fails
      }
    }

    return NextResponse.json(
      { success: true, id: application.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الطلب', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/applications - Get all applications (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const jobSlug = searchParams.get('job');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (jobSlug) {
      where.job = { slug: jobSlug };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { select: { title: true, slug: true, icon: true } },
          files: { select: { fileUrl: true, fileName: true } },
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الطلبات' },
      { status: 500 }
    );
  }
}
