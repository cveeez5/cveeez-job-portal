import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { JOB_QUESTIONS } from '@/lib/constants';
import { scoreApplication, hasScoring } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  REVIEWED: 'تمت المراجعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  SHORTLISTED: 'قائمة مختصرة',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  no_experience: 'بدون خبرة',
  less_than_1: 'أقل من سنة',
  '1_to_3': '١ - ٣ سنوات',
  '3_to_5': '٣ - ٥ سنوات',
  more_than_5: 'أكثر من ٥ سنوات',
};

function sanitizeSheetName(name: string): string {
  // Excel sheet names: max 31 chars, no \ / ? * [ ]
  return name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobSlugFilter = searchParams.get('job');
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (jobSlugFilter) where.job = { slug: jobSlugFilter };
    if (statusFilter) where.status = statusFilter;

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: { select: { title: true, slug: true, icon: true } },
        files: { select: { fileName: true, fileUrl: true } },
        answers: {
          include: { question: { select: { text: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CVEEEZ Admin';
    workbook.created = new Date();

    // Group applications by job
    const grouped = new Map<string, typeof applications>();
    for (const app of applications) {
      const key = app.job.slug;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(app);
    }

    if (grouped.size === 0) {
      // Empty workbook with a placeholder sheet
      const ws = workbook.addWorksheet('لا يوجد طلبات');
      ws.addRow(['مفيش طلبات تطابق الفلتر']);
    }

    for (const [jobSlug, apps] of grouped) {
      const jobTitle = apps[0].job.title;
      const sheet = workbook.addWorksheet(sanitizeSheetName(`${apps[0].job.icon || ''} ${jobTitle}`), {
        views: [{ rightToLeft: true }],
      });

      // التقييم الآلي (لو الوظيفة عندها نظام تقييم): عمود درجة + ترتيب تنازلي
      const scored = hasScoring(jobSlug);
      const scoreById = new Map<string, number | null>();
      let sheetApps = apps;
      if (scored) {
        for (const app of apps) {
          const s = scoreApplication(jobSlug, app.answersJson as Record<string, string> | null);
          scoreById.set(app.id, s.hasScoring ? s.percent : null);
        }
        sheetApps = [...apps].sort(
          (a, b) => (scoreById.get(b.id) ?? -1) - (scoreById.get(a.id) ?? -1)
        );
      }

      // Build dynamic question columns from constants (preferred) + answers fallback
      const constQuestions = JOB_QUESTIONS[jobSlug] || [];
      const constQuestionIds = new Set(constQuestions.map((q) => q.id));

      // Discover any extra question IDs that appear in answersJson but not in constants
      const extraQuestionIds = new Set<string>();
      for (const app of apps) {
        if (app.answersJson && typeof app.answersJson === 'object') {
          for (const k of Object.keys(app.answersJson as Record<string, string>)) {
            if (!constQuestionIds.has(k)) extraQuestionIds.add(k);
          }
        }
      }

      // Header row
      const baseHeaders = [
        '#',
        'تاريخ التقديم',
        'الحالة',
        ...(scored ? ['الدرجة %'] : []),
        'الاسم',
        'الإيميل',
        'الموبايل',
        'المدينة',
        'سنين الخبرة',
        'لينكدإن',
        'الملفات المرفقة',
      ];

      const questionHeaders = [
        ...constQuestions.map((q) => q.text),
        ...Array.from(extraQuestionIds),
      ];

      const trailingHeaders = ['ملاحظات الإدارة'];

      const allHeaders = [...baseHeaders, ...questionHeaders, ...trailingHeaders];
      const headerRow = sheet.addRow(allHeaders);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
      headerRow.height = 32;

      // Data rows
      sheetApps.forEach((app, idx) => {
        const answersMap = (app.answersJson as Record<string, string> | null) || {};

        // Also merge in answers from the Answer table (keyed by question text → value)
        const answersByText: Record<string, string> = {};
        for (const a of app.answers) {
          answersByText[a.question.text] = a.value;
        }

        const filesText = app.files
          .map((f) => `${f.fileName}: ${f.fileUrl}`)
          .join('\n');

        const row: (string | number | Date | null)[] = [
          idx + 1,
          app.createdAt,
          STATUS_LABELS[app.status] || app.status,
          ...(scored ? [scoreById.get(app.id) ?? ''] : []),
          app.name,
          app.email,
          app.phone || '',
          app.city || '',
          EXPERIENCE_LABELS[app.yearsOfExperience || ''] || app.yearsOfExperience || '',
          app.linkedinUrl || '',
          filesText,
        ];

        // Question columns
        for (const q of constQuestions) {
          row.push(answersMap[q.id] ?? answersByText[q.text] ?? '');
        }
        for (const extraId of extraQuestionIds) {
          row.push(answersMap[extraId] ?? '');
        }

        row.push(app.notes || '');

        const dataRow = sheet.addRow(row);
        dataRow.alignment = { vertical: 'top', horizontal: 'right', wrapText: true };
      });

      // Format the date column
      sheet.getColumn(2).numFmt = 'yyyy-mm-dd hh:mm';

      // Auto-fit-ish: set reasonable widths
      sheet.columns.forEach((col, i) => {
        if (i === 0) {
          col.width = 5;
        } else if (i < baseHeaders.length) {
          col.width = 22;
        } else {
          col.width = 35;
        }
      });

      // Freeze header
      sheet.views = [{ rightToLeft: true, state: 'frozen', ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().slice(0, 10);
    const filename = jobSlugFilter
      ? `applications-${jobSlugFilter}-${date}.xlsx`
      : `applications-all-${date}.xlsx`;

    return new NextResponse(buffer as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير الملف', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
