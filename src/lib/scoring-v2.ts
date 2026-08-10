// src/lib/scoring-v2.ts
// محرك التقييم لفورم المودريتور v2.
//
// مهم: كل الدوال دي بتشتغل على السيرفر كمان — الاستبعاد والدرجة مش بيتحسبوا
// في المتصفح خالص. الفرونت بيستخدم detectModeratorV2Knockout بس عشان يوقف
// الفورم بدري، والسيرفر بيعيد حسابها من الإجابات الخام قبل أي حفظ.
//
// التقييم v1 (scoring.ts) سايبينه زي ما هو للطلبات القديمة.

import {
  MODERATOR_V2_SECTIONS,
  MODERATOR_V2_PENALTIES,
  MODERATOR_V2_THRESHOLDS,
  MODERATOR_V2_MAX_SCORE,
  getV2Option,
  type V2Question,
  type V2SectionId,
  type V2Penalty,
} from './moderator-v2';
// استيراد أنواع بس — الملف ده بيتحمّل في المتصفح كمان (الفرونت بيستخدم
// detectModeratorV2Knockout)، فمينفعش نجرّ معاه مكتبة الـAI.
import type { AiScoreRequest, AiScoreOutcome } from './ai-scorer';

// ===================== تطبيع النص العربي =====================
const DIACRITICS = /[ً-ٰٟـ]/g;
const LEADING_NOISE = /^[\s\p{P}\p{S}]+/u;

/** توحيد الألف بأنواعها والتاء المربوطة/الهاء وشيل التشكيل — للمقارنات النصية. */
export function normalizeArabic(input: string): string {
  return input
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}

/**
 * اختبار w3 المخفي: الإجابة لازم تبدأ بكلمة «جاهزة».
 * بنشيل المسافات والأقواس وعلامات الترقيم من الأول قبل المقارنة، فـ
 * «(جاهزة)» و«جاهزه» و« جاهزة، » كلهم بيعدّوا صح.
 */
export function startsWithReadyKeyword(answer: string): boolean {
  const cleaned = normalizeArabic(answer).replace(LEADING_NOISE, '');
  return cleaned.startsWith(normalizeArabic('جاهزة'));
}

// ===================== أنواع النتيجة =====================
export interface V2Knockout {
  questionId: string;
  question: string;
  answerLabel: string;
  /** النص اللي بيتخزن في knockoutReason. */
  reason: string;
}

export interface V2Flag {
  questionId: string;
  label: string;
  note: string;
}

export interface V2QuestionScore {
  section: V2SectionId;
  max: number;
  earned: number;
  source: 'option' | 'ai' | 'heuristic' | 'data';
  reason?: string;
}

export interface V2SectionScore {
  earned: number;
  max: number;
}

export interface V2ScoreBreakdown {
  sections: Record<string, V2SectionScore>;
  questions: Record<string, V2QuestionScore>;
  rawTotal: number;
  provider: string;
  model?: string;
  needsRescore: boolean;
  error?: string;
}

export interface ModeratorV2Evaluation {
  knockout: V2Knockout | null;
  /** الدرجة بعد الخصومات (0..100). null لو فيه استبعاد. */
  totalScore: number | null;
  grade: string | null;
  gradeAction: string | null;
  breakdown: V2ScoreBreakdown | null;
  penalties: V2Penalty[];
  flags: V2Flag[];
}

// ===================== مساعدات =====================
type Answers = Record<string, string>;

function answerOf(answers: Answers, id: string): string {
  return (answers[id] ?? '').trim();
}

function shortLabel(question: V2Question): string {
  const oneLine = question.label.replace(/\s+/g, ' ').trim();
  return oneLine.length > 70 ? `${oneLine.slice(0, 70)}…` : oneLine;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ===================== الاستبعاد التلقائي =====================
/** أول خيار عليه knockout بيوقف كل حاجة. بيرجّع null لو مفيش استبعاد. */
export function detectModeratorV2Knockout(answers: Answers): V2Knockout | null {
  for (const section of MODERATOR_V2_SECTIONS) {
    for (const question of section.questions) {
      const value = answerOf(answers, question.id);
      if (!value) continue;
      const option = getV2Option(question, value);
      if (option?.knockout) {
        return {
          questionId: question.id,
          question: shortLabel(question),
          answerLabel: option.label,
          reason: `${question.id} — ${shortLabel(question)} → «${option.label}»`,
        };
      }
    }
  }
  return null;
}

/** الخيارات اللي عليها flag: مش استبعاد، بس بتبان للأدمن. */
export function collectModeratorV2Flags(answers: Answers): V2Flag[] {
  const flags: V2Flag[] = [];
  for (const section of MODERATOR_V2_SECTIONS) {
    for (const question of section.questions) {
      const value = answerOf(answers, question.id);
      if (!value) continue;
      const option = getV2Option(question, value);
      if (option?.flag) {
        flags.push({
          questionId: question.id,
          label: shortLabel(question),
          note: option.label,
        });
      }
    }
  }
  return flags;
}

// ===================== التحقق من الأسئلة المطلوبة =====================
/** بيرجّع ids الأسئلة المطلوبة اللي مجاوبتش — التحقق بيتعاد على السيرفر. */
export function findMissingRequired(answers: Answers): string[] {
  const missing: string[] = [];
  for (const section of MODERATOR_V2_SECTIONS) {
    for (const question of section.questions) {
      if (question.required && !answerOf(answers, question.id)) {
        missing.push(question.id);
      }
    }
  }
  return missing;
}

// ===================== طلبات تقييم الـAI =====================
/** الأسئلة المفتوحة اللي وزنها > 0 وعندها rubric. */
export function buildAiScoreRequests(answers: Answers): AiScoreRequest[] {
  const requests: AiScoreRequest[] = [];
  for (const section of MODERATOR_V2_SECTIONS) {
    for (const question of section.questions) {
      const weight = question.weight ?? 0;
      if (weight <= 0 || question.options || !question.rubric) continue;
      requests.push({
        questionId: question.id,
        label: question.label,
        rubric: question.rubric,
        maxScore: weight,
        answer: answerOf(answers, question.id),
      });
    }
  }
  return requests;
}

// ===================== التقييم الكامل =====================
/**
 * بيجمّع نتيجة التقييم من الإجابات + درجات الأسئلة المفتوحة.
 * دالة متزامنة عن قصد عشان تتاخد نتيجة الـAI من بره (أو تتعاد لاحقاً بزرار
 * إعادة التقييم من غير ما نلمس منطق الحساب).
 */
export function evaluateModeratorV2(
  answers: Answers,
  aiOutcome: AiScoreOutcome
): ModeratorV2Evaluation {
  const knockout = detectModeratorV2Knockout(answers);
  const flags = collectModeratorV2Flags(answers);

  if (knockout) {
    return {
      knockout,
      totalScore: null,
      grade: null,
      gradeAction: null,
      breakdown: null,
      penalties: [],
      flags,
    };
  }

  const sections: Record<string, V2SectionScore> = {};
  const questions: Record<string, V2QuestionScore> = {};
  let rawTotal = 0;

  for (const section of MODERATOR_V2_SECTIONS) {
    let sectionEarned = 0;
    let sectionMax = 0;

    for (const question of section.questions) {
      const weight = question.weight ?? 0;
      const value = answerOf(answers, question.id);

      // وزن 0 = بيانات فقط: بتتعرض للأدمن ومتتحسبش في الدرجة
      if (weight <= 0) {
        questions[question.id] = {
          section: section.id,
          max: 0,
          earned: 0,
          source: 'data',
        };
        continue;
      }

      sectionMax += weight;

      if (question.options) {
        // أسئلة الاختيار: الدرجة من الحقل score في الأوبشن مباشرة
        const option = value ? getV2Option(question, value) : undefined;
        const earned = Math.max(0, Math.min(weight, option?.score ?? 0));
        sectionEarned += earned;
        questions[question.id] = {
          section: section.id,
          max: weight,
          earned: round1(earned),
          source: 'option',
        };
        continue;
      }

      // أسئلة مفتوحة: الدرجة من الـAI (أو التقييم التقريبي لو مش متاح)
      const ai = aiOutcome.scores[question.id];
      const earned = Math.max(0, Math.min(weight, ai?.score ?? 0));
      sectionEarned += earned;
      questions[question.id] = {
        section: section.id,
        max: weight,
        earned: round1(earned),
        source: aiOutcome.provider === 'gemini' ? 'ai' : 'heuristic',
        reason: ai?.reason,
      };
    }

    if (sectionMax > 0) {
      sections[section.id] = { earned: round1(sectionEarned), max: sectionMax };
      rawTotal += sectionEarned;
    }
  }

  rawTotal = round1(rawTotal);

  // ===== الخصومات =====
  const penalties: V2Penalty[] = [];
  const readyRule = MODERATOR_V2_PENALTIES[0];
  if (readyRule && !startsWithReadyKeyword(answerOf(answers, 'w3'))) {
    penalties.push(readyRule);
  }

  const penaltyTotal = penalties.reduce((sum, p) => sum + p.points, 0);
  const totalScore = Math.max(
    0,
    Math.min(MODERATOR_V2_MAX_SCORE, round1(rawTotal + penaltyTotal))
  );

  const threshold =
    MODERATOR_V2_THRESHOLDS.find((t) => totalScore >= t.min) ??
    MODERATOR_V2_THRESHOLDS[MODERATOR_V2_THRESHOLDS.length - 1];

  return {
    knockout: null,
    totalScore,
    grade: threshold.label,
    gradeAction: threshold.action,
    breakdown: {
      sections,
      questions,
      rawTotal,
      provider: aiOutcome.provider,
      model: aiOutcome.model,
      needsRescore: aiOutcome.needsRescore,
      error: aiOutcome.error,
    },
    penalties,
    flags,
  };
}

// ملاحظة: المسار الكامل (استبعاد → تقييم بالـAI → حفظ) موجود في
// moderator-v2-service.ts عشان مكتبة الـAI متتحمّلش في المتصفح.

// ===================== مؤشرات النسخ =====================
export interface V2AnswerMeta {
  /** الوقت المستغرق في الحقل بالثواني. */
  seconds: number;
  /** هل حصل paste في الحقل ده. */
  pasted: boolean;
  chars: number;
}

/** بننضّف الميتاداتا الجاية من المتصفح قبل ما نخزنها (مش موثوقة). */
export function sanitizeAnswerMeta(input: unknown): Record<string, V2AnswerMeta> | null {
  if (!input || typeof input !== 'object') return null;
  const out: Record<string, V2AnswerMeta> = {};

  for (const [id, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const meta = raw as Record<string, unknown>;
    const seconds = Number(meta.seconds);
    const chars = Number(meta.chars);
    out[id] = {
      seconds: isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0,
      pasted: meta.pasted === true,
      chars: isFinite(chars) ? Math.max(0, Math.round(chars)) : 0,
    };
  }

  return Object.keys(out).length > 0 ? out : null;
}

/**
 * مؤشر «إجابة مشبوهة»: كتابة كتير في وقت قليل، أو لصق مع سرعة عالية.
 * ده مؤشر للأدمن بس — مش استبعاد تلقائي ولا بيأثر على الدرجة.
 */
export function copyRiskLevel(meta: V2AnswerMeta | undefined): 'none' | 'low' | 'high' {
  if (!meta) return 'none';
  const charsPerSecond = meta.seconds > 0 ? meta.chars / meta.seconds : meta.chars;

  if (meta.pasted && meta.chars >= 200 && charsPerSecond > 15) return 'high';
  if (meta.pasted && meta.chars >= 120) return 'low';
  if (!meta.pasted && meta.chars >= 200 && charsPerSecond > 25) return 'low';
  return 'none';
}

// ===================== عرض الدرجة =====================
export function v2GradeStyle(grade: string | null): { color: string; text: string; label: string } {
  switch (grade) {
    case 'A':
      return { color: 'bg-green-500/20 text-green-400', text: 'text-green-400', label: 'A' };
    case 'B':
      return { color: 'bg-yellow-500/20 text-yellow-400', text: 'text-yellow-400', label: 'B' };
    case 'C':
      return { color: 'bg-red-500/20 text-red-400', text: 'text-red-400', label: 'C' };
    default:
      return { color: 'bg-white/5 text-white/40', text: 'text-white/40', label: '—' };
  }
}

export const V2_SECTION_TITLES: Record<string, string> = {
  gate: 'بوابة الفلترة',
  basics: 'البيانات',
  experience: 'الخبرة',
  worksample: 'اختبارات الشغل',
  ai: 'الذكاء الاصطناعي',
  commitment: 'الالتزام والجدية',
};
