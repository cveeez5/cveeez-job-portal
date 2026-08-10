import { NextRequest, NextResponse } from 'next/server';
import { rescoreApplication } from '@/lib/moderator-v2-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/applications/[id]/rescore - إعادة تقييم الأسئلة المفتوحة بالـAI (أدمن)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await rescoreApplication(id);

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      totalScore: result.evaluation?.totalScore ?? null,
      grade: result.evaluation?.grade ?? null,
      provider: result.evaluation?.breakdown?.provider ?? null,
      needsRescore: result.evaluation?.breakdown?.needsRescore ?? false,
    });
  } catch (error) {
    console.error('Error rescoring application:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ في إعادة التقييم',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
