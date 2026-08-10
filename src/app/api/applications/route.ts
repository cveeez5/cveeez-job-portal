import { NextRequest, NextResponse, after } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/cloudflare-r2';
import { scoreApplication } from '@/lib/scoring';
import { sanitizeAnswerMeta } from '@/lib/scoring-v2';
import {
  MODERATOR_V2_REJECTION_MESSAGE,
  MODERATOR_FORM_VERSION,
} from '@/lib/moderator-v2';
import {
  evaluateFast,
  evaluationToColumns,
  mapV2AnswersToColumns,
  findMissingRequired,
  rescoreApplication,
} from '@/lib/moderator-v2-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** الوظيفة الوحيدة اللي شغالة بفورم v2 دلوقتي. */
const V2_JOB_SLUG = 'moderator';

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
    const formVersion = parseInt((formData.get('formVersion') as string) || '1', 10) || 1;

    if (!jobSlug) {
      return NextResponse.json({ error: 'الوظيفة مطلوبة' }, { status: 400 });
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
          Object.entries(answers)
            .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
            .map(([k, v]) => [k, v.trim()])
        );
        if (Object.keys(filtered).length > 0) {
          parsedAnswers = filtered;
        }
      } catch {
        console.error('Error parsing answers JSON');
      }
    }

    // ===================== مسار فورم المودريتور v2 =====================
    if (formVersion >= MODERATOR_FORM_VERSION && jobSlug === V2_JOB_SLUG) {
      return await handleModeratorV2({
        jobId: job.id,
        answers: parsedAnswers || {},
        answerMetaRaw: formData.get('answerMeta') as string | null,
      });
    }

    // Validate required fields (الفورم القديم)
    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والإيميل والوظيفة مطلوبين' },
        { status: 400 }
      );
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

/**
 * حفظ وتقييم طلب فورم المودريتور v2.
 *
 * الاستبعاد والدرجة بيتحسبوا هنا من الإجابات الخام — أي حاجة جاية من المتصفح
 * (درجة / تصنيف / نتيجة استبعاد) بتتجاهَل تماماً عشان حد ميقدرش يعدّل الريكوست.
 */
async function handleModeratorV2({
  jobId,
  answers,
  answerMetaRaw,
}: {
  jobId: string;
  answers: Record<string, string>;
  answerMetaRaw: string | null;
}) {
  const evaluation = evaluateFast(answers);
  const columns = mapV2AnswersToColumns(answers);

  // ===== استبعاد تلقائي: بنسجّل الطلب بالإجابات اللي وصلت ونقف =====
  if (evaluation.knockout) {
    const application = await prisma.application.create({
      data: {
        jobId,
        formVersion: MODERATOR_FORM_VERSION,
        status: 'REJECTED_AUTO',
        // البوابة بتيجي قبل البيانات الشخصية، فممكن الاسم والإيميل يكونوا لسه فاضيين
        name: columns.name,
        email: columns.email,
        phone: columns.phone,
        city: columns.city,
        yearsOfExperience: columns.yearsOfExperience,
        answersJson: answers,
        ...evaluationToColumns(evaluation),
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: application.id,
        knockout: true,
        message: MODERATOR_V2_REJECTION_MESSAGE,
      },
      { status: 201 }
    );
  }

  // ===== التحقق من الأسئلة المطلوبة (بيتعاد على السيرفر) =====
  const missing = findMissingRequired(answers);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'في أسئلة مطلوبة لسه فاضية', missing },
      { status: 400 }
    );
  }

  let answerMeta = null;
  if (answerMetaRaw) {
    try {
      answerMeta = sanitizeAnswerMeta(JSON.parse(answerMetaRaw));
    } catch {
      console.error('Error parsing answerMeta JSON');
    }
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      formVersion: MODERATOR_FORM_VERSION,
      name: columns.name,
      email: columns.email,
      phone: columns.phone,
      city: columns.city,
      yearsOfExperience: columns.yearsOfExperience,
      answersJson: answers,
      answerMeta: (answerMeta ?? undefined) as Prisma.InputJsonValue | undefined,
      ...evaluationToColumns(evaluation),
    },
  });

  // الأسئلة المفتوحة بتتقيّم بالـAI بعد ما الرد يوصل للمتقدمة — عشان متستناش،
  // ولو الـAI وقع الطلب محفوظ بالفعل بتقييم تقريبي وممكن يتعاد من الأدمن.
  after(async () => {
    try {
      await rescoreApplication(application.id);
    } catch (error) {
      console.error('[moderator-v2] background rescore failed:', error);
    }
  });

  return NextResponse.json(
    { success: true, id: application.id, knockout: false },
    { status: 201 }
  );
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
    const sort = searchParams.get('sort'); // 'score' لترتيب حسب الدرجة
    const dateFrom = searchParams.get('dateFrom'); // yyyy-mm-dd
    const dateTo = searchParams.get('dateTo'); // yyyy-mm-dd
    const scoreBucket = searchParams.get('scoreBucket'); // excellent|good|mid|low|flagged|unscored

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

    // فلتر التاريخ (من / إلى) — لليوم الأخير بنشمل اليوم كله
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (dateFrom) {
      const d = new Date(`${dateFrom}T00:00:00`);
      if (!isNaN(d.getTime())) createdAt.gte = d;
    }
    if (dateTo) {
      const d = new Date(`${dateTo}T23:59:59.999`);
      if (!isNaN(d.getTime())) createdAt.lte = d;
    }
    if (createdAt.gte || createdAt.lte) {
      where.createdAt = createdAt;
    }

    const include = {
      job: { select: { title: true, slug: true, icon: true } },
      files: { select: { fileUrl: true, fileName: true } },
      _count: { select: { answers: true } },
    } as const;

    // طلبات v2: الدرجة متخزّنة في الداتابيز (totalScore) وقت الإرسال.
    // طلبات v1: الدرجة بتتحسب وقت العرض من answersJson زي ما كانت بالظبط.
    // الطلبات القديمة اللي مجاوبتش على أي سؤال متقيَّم درجتها null عشان تظهر "—" مش 0%
    const attachScore = <
      T extends {
        job: { slug: string };
        answersJson: unknown;
        formVersion: number;
        totalScore: number | null;
        grade: string | null;
        flags: unknown;
        knockoutReason: string | null;
      },
    >(
      app: T
    ) => {
      if (app.formVersion >= 2) {
        const v2Flags = Array.isArray(app.flags) ? app.flags.length : 0;
        return { ...app, score: app.totalScore, scoreFlags: v2Flags };
      }
      const s = scoreApplication(
        app.job.slug,
        app.answersJson as Record<string, string> | null
      );
      const score = s.hasScoring && s.answeredScored > 0 ? s.percent : null;
      return { ...app, score, scoreFlags: s.flags.length };
    };

    const inBucket = (
      score: number | null,
      flags: number,
      grade: string | null,
      knockoutReason: string | null
    ): boolean => {
      switch (scoreBucket) {
        case 'excellent':
          return score !== null && score >= 80;
        case 'good':
          return score !== null && score >= 60 && score < 80;
        case 'mid':
          return score !== null && score >= 40 && score < 60;
        case 'low':
          return score !== null && score < 40;
        case 'gradeA':
          return grade === 'A';
        case 'gradeB':
          return grade === 'B';
        case 'gradeC':
          return grade === 'C';
        case 'knockout':
          return !!knockoutReason;
        case 'flagged':
          return flags > 0;
        case 'unscored':
          return score === null && !knockoutReason;
        default:
          return true;
      }
    };

    // مسار في الذاكرة: مطلوب لما نرتّب بالدرجة أو نفلتر بشريحة درجة
    // (الدرجة محسوبة وقت العرض مش متخزّنة في قاعدة البيانات)
    if (sort === 'score' || scoreBucket) {
      const all = await prisma.application.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
      });
      let scored = all.map(attachScore);
      if (scoreBucket) {
        scored = scored.filter((a) =>
          inBucket(a.score, a.scoreFlags, a.grade, a.knockoutReason)
        );
      }
      // نرتّب بالدرجة (الأعلى أولاً) لو اتطلب الترتيب أو الفلترة بالدرجة
      scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      const total = scored.length;
      const data = scored.slice(skip, skip + limit);

      return NextResponse.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      data: applications.map(attachScore),
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
