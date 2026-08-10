// src/lib/moderator-v2-service.ts
// حفظ وتقييم طلبات فورم المودريتور v2.
//
// السيرفر بيعيد حساب الاستبعاد والدرجة من الإجابات الخام دايماً — أي حاجة
// جاية من المتصفح (درجة/استبعاد/تصنيف) بتتجاهَل تماماً.

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  evaluateModeratorV2,
  buildAiScoreRequests,
  detectModeratorV2Knockout,
  findMissingRequired,
  type ModeratorV2Evaluation,
} from './scoring-v2';
import { getAiScorer, heuristicScore } from './ai-scorer';
import { getV2Question, v2OptionLabel } from './moderator-v2';

export type V2Answers = Record<string, string>;

/** الحقول القياسية في جدول Application بتتملّي من إجابات v2. */
export function mapV2AnswersToColumns(answers: V2Answers) {
  const get = (id: string) => (answers[id] ?? '').trim();
  return {
    name: get('b1'),
    email: get('b_email'),
    phone: get('b3') || null,
    city: get('b5') || null,
    // بنخزّن نص الخيار عشان الأدمن القديم والإكسبورت يعرضوه مفهوم
    yearsOfExperience: get('e1') ? v2OptionLabel('e1', get('e1')) : null,
  };
}

/** بيحوّل نتيجة التقييم لحقول جاهزة للحفظ في الداتابيز. */
export function evaluationToColumns(evaluation: ModeratorV2Evaluation) {
  return {
    totalScore: evaluation.totalScore,
    grade: evaluation.grade,
    knockoutReason: evaluation.knockout?.reason ?? null,
    scoreBreakdown: (evaluation.breakdown
      ? (evaluation.breakdown as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull) as Prisma.InputJsonValue,
    penalties: evaluation.penalties as unknown as Prisma.InputJsonValue,
    flags: evaluation.flags as unknown as Prisma.InputJsonValue,
  };
}

/**
 * تقييم سريع بيتعمل وقت الحفظ: أسئلة الاختيار بتتحسب بالظبط، والأسئلة
 * المفتوحة بتاخد تقييم تقريبي مؤقت. بعدها الـAI بيعيد تقييمها في الخلفية
 * عشان المتقدمة متستناش، والطلب ميضيعش لو الـAI وقع.
 */
export async function scoreModeratorV2(answers: V2Answers): Promise<ModeratorV2Evaluation> {
  if (detectModeratorV2Knockout(answers)) {
    // مفيش داعي نستهلك الـAI على طلب مستبعد
    return evaluateModeratorV2(answers, {
      scores: {},
      provider: 'heuristic',
      needsRescore: false,
    });
  }

  const requests = buildAiScoreRequests(answers);
  const scorer = getAiScorer();
  const outcome = scorer.isAvailable() ? await scorer.score(requests) : heuristicScore(requests);
  return evaluateModeratorV2(answers, outcome);
}

export function evaluateFast(answers: V2Answers): ModeratorV2Evaluation {
  if (detectModeratorV2Knockout(answers)) {
    return evaluateModeratorV2(answers, {
      scores: {},
      provider: 'heuristic',
      needsRescore: false,
    });
  }
  return evaluateModeratorV2(answers, heuristicScore(buildAiScoreRequests(answers)));
}

export { findMissingRequired };

/** نص السؤال المطلوب اللي ناقص — للرسائل. */
export function missingRequiredLabels(ids: string[]): string[] {
  return ids.map((id) => getV2Question(id)?.label ?? id);
}

/**
 * إعادة تقييم طلب v2 بالـAI. بتتنادى في الخلفية بعد الحفظ، وكمان من زرار
 * «إعادة التقييم» في الأدمن. آمنة للتكرار (idempotent).
 */
export async function rescoreApplication(
  applicationId: string
): Promise<{ ok: boolean; reason?: string; evaluation?: ModeratorV2Evaluation }> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, formVersion: true, answersJson: true, knockoutReason: true },
  });

  if (!application) return { ok: false, reason: 'الطلب مش موجود' };
  if (application.formVersion < 2) return { ok: false, reason: 'الطلب من نسخة فورم قديمة' };
  if (application.knockoutReason) return { ok: false, reason: 'الطلب مستبعد تلقائياً' };

  const answers = (application.answersJson as V2Answers | null) || {};
  const evaluation = await scoreModeratorV2(answers);

  await prisma.application.update({
    where: { id: applicationId },
    data: evaluationToColumns(evaluation),
  });

  return { ok: true, evaluation };
}
