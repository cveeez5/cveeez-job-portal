// src/lib/scoring.ts
// نظام تقييم آلي للتقديمات: بيحوّل إجابات المتقدم لدرجة من 0 لـ 100
// بناءً على جودة + اكتمال الإجابات. مربوط بالـ id بتاع كل سؤال في constants.ts
//
// منطق الدرجة:
//   - كل سؤال له وزن (weight). الأسئلة "بيانات بس" وزنها 0 فمابتأثرش على الدرجة.
//   - لكل سؤال بنحسب نسبة (fraction) من 0 لـ 1 حسب جودة الإجابة.
//   - earned = Σ(weight × fraction)  ،  max = Σ(weight)  ،  percent = earned/max × 100
//   - السؤال اللي اتساب فاضي بياخد 0 (عشان نكافئ الاكتمال = جودة + كمية).

export type ScoringKind = 'option' | 'text' | 'number' | 'url' | 'presence';

export interface QuestionScoring {
  /** الوزن النسبي (0 = بيانات فقط، مش بتتحسب في الدرجة). */
  weight: number;
  kind: ScoringKind;
  /** للنوع option: كل خيار → نسبة من 0 لـ 1 (لازم تطابق نص الخيار في constants.ts بالظبط). */
  optionPoints?: Record<string, number>;
  /** للنوع text: كلمات دلالية بتدّي نقاط إضافية. */
  keywords?: string[];
  /** للنوع text: الحد الأدنى للحروف لإجابة جوهرية. */
  minLength?: number;
  /** للنوع number: القيمة اللي بتاخد الدرجة الكاملة. */
  goodNumberThreshold?: number;
}

export interface ScoreBreakdownItem {
  id: string;
  weight: number;
  fraction: number; // 0..1
  earned: number; // weight × fraction
  answered: boolean;
  isRedFlag: boolean;
}

export interface ApplicationScore {
  /** الدرجة النهائية 0..100 (مقرّبة). */
  percent: number;
  earned: number;
  max: number;
  /** عدد الأسئلة المُقيَّمة اللي اتجاوب عليها. */
  answeredScored: number;
  /** إجمالي عدد الأسئلة المُقيَّمة (وزنها > 0). */
  totalScored: number;
  breakdown: ScoreBreakdownItem[];
  /** رسائل تحذيرية (إجابات تستدعي مراجعة بشرية / غير مناسبة للدور). */
  flags: string[];
  /** هل الوظيفة دي عندها نظام تقييم أصلاً؟ */
  hasScoring: boolean;
}

// ===================== إعداد تقييم وظيفة المودريتور =====================
const MODERATOR_SCORING: Record<string, QuestionScoring> = {
  // بيانات بس — وزن 0 عشان ميعاقبش حد بسبب شهادة/مكان/توقع راتب
  education_level: { kind: 'option', weight: 0 },
  specialization: { kind: 'text', weight: 0 },
  governorate: { kind: 'text', weight: 0 },
  expected_salary: { kind: 'number', weight: 0 },

  // الخبرة
  sales_experience_years: {
    kind: 'option',
    weight: 8,
    optionPoints: {
      'من غير خبرة': 0.15,
      'أقل من سنة': 0.4,
      '1-2 سنة': 0.7,
      '3-5 سنين': 0.9,
      'أكتر من 5 سنين': 1,
    },
  },
  experience_summary: {
    kind: 'text',
    weight: 7,
    minLength: 100,
    keywords: ['شات', 'مبيعات', 'خدمة عملاء', 'كول سنتر', 'تارجت', 'إقناع', 'عملاء', 'قفلت', 'تحويل', 'متابعة'],
  },
  companies_worked: { kind: 'text', weight: 4, minLength: 30 },
  portfolio_or_profile: { kind: 'url', weight: 2 },

  // المبيعات والإقناع (أقوى الإشارات)
  daily_closes: {
    kind: 'option',
    weight: 8,
    optionPoints: {
      'لسه مقفلتش مبيعات قبل كده': 0.2,
      '1-2 في اليوم': 0.5,
      '3-5 في اليوم': 0.75,
      '6-10 في اليوم': 0.9,
      'أكتر من 10 في اليوم': 1,
    },
  },
  biggest_sales_story: {
    kind: 'text',
    weight: 7,
    minLength: 90,
    keywords: ['تارجت', '%', 'نسبة', 'شهر', 'ثابت', 'متابعة', 'اعتراض', 'صفقة', 'قفل', 'متكرر'],
  },
  persuasion_writing_sample: {
    kind: 'text',
    weight: 10,
    minLength: 60,
    keywords: ['قيمة', 'نتيجة', 'تعالى', 'دلوقتي', 'ابدأ', 'فرصة', 'خطوة', 'احترافي', 'اطمن', 'ساعدك'],
  },
  objection_handling: {
    kind: 'text',
    weight: 7,
    minLength: 80,
    keywords: ['قيمة', 'نتيجة', 'استثمار', 'تقسيط', 'فرق', 'بدل ما', 'تعالى نجرب', 'دلوقتي', 'أطمنك', 'إيه اللي قلقك'],
  },
  save_the_sale: {
    kind: 'text',
    weight: 5,
    minLength: 80,
    keywords: ['أتفهم', 'أعتذر', 'تعديل', 'أصلح', 'أطمنه', 'رضاه', 'بهدوء', 'احترام', 'أعوضه', 'أحل المشكلة'],
  },
  speed_triage: {
    kind: 'option',
    weight: 7,
    optionPoints: {
      'برد على الأقرب للشراء/الأكثر جدية الأول وأطمّن الباقي إني جاي عليهم': 1,
      'برد بالترتيب اللي وصلوا بيه واحد ورا التاني': 0.65,
      'بنسخ نفس الرد وأبعته للكل': 0.35,
      'بيحصلي ضغط وبتلخبط': 0.1,
    },
  },
  won_back_customer: {
    kind: 'text',
    weight: 4,
    minLength: 60,
    keywords: ['رفض', 'رجّعته', 'متابعة', 'عرض', 'أقنعته', 'اعتراض', 'قفلت', 'اشترى', 'تواصل'],
  },

  // الذكاء الاصطناعي
  ai_tools_used: {
    kind: 'option',
    weight: 4,
    optionPoints: {
      'مستخدمتش أدوات AI في الشغل قبل كده': 0.2,
      'استخدمت أداة واحدة بشكل بسيط': 0.5,
      'بستخدم ChatGPT/Claude/Gemini في شغلي بشكل منتظم': 0.85,
      'بستخدم أكتر من أداة AI وعندي طريقة شغل ثابتة بيهم': 1,
    },
  },
  ai_prompt_sample: {
    kind: 'text',
    weight: 5,
    minLength: 50,
    keywords: ['عميل', 'متردد', 'رد', 'إقناع', 'مبيعات', 'اكتب', 'صيغ', 'اعتراض', 'خدمة', 'مصري'],
  },

  // اللوجستيات والالتزام
  has_laptop: {
    kind: 'option',
    weight: 7,
    optionPoints: {
      'آه، لاب توب خاص + نت ثابت + مكان هادي': 1,
      'معايا لاب توب بس النت/المكان مش مظبوط': 0.55,
      'لسه هحتاج أوفّر لاب توب': 0.2,
      'لأ': 0,
    },
  },
  available_shifts: {
    kind: 'text',
    weight: 5,
    minLength: 4,
    keywords: ['صباحي', 'مسائي', 'ليلي', 'أي شيفت', 'مرن', 'أكتر من شيفت'],
  },
  training_commitment: {
    kind: 'option',
    weight: 5,
    optionPoints: {
      'آه تماماً ومستعد أتعلم بأقصى سرعة': 1,
      'مستعد بس محتاج أفهم تفاصيل أكتر': 0.6,
      'مش مناسب ليا': 0,
    },
  },
  contract_commitment: {
    kind: 'option',
    weight: 8,
    optionPoints: {
      'آه مبدئياً مستعد ألتزم بالسنة والإبلاغ المسبق': 1,
      'مبدئياً موافق بس محتاج أراجع تفاصيل العقد قبل التوقيع': 0.7,
      'مش متأكد': 0.15,
    },
  },
  conduct_acknowledgement: {
    kind: 'option',
    weight: 6,
    optionPoints: {
      'آه مطّلع ومبدئياً موافق وملتزم بالمهنية': 1,
      'مطّلع وحابب أراجع التفاصيل في الانترفيو': 0.7,
      'لأ': 0,
    },
  },
  reports_commitment: {
    kind: 'text',
    weight: 5,
    minLength: 80,
    keywords: ['تعليمات', 'مانيوال', 'تقرير', 'اتعلمت', 'طبّقت', 'التزمت', 'بسرعة', 'دقة', 'سألت'],
  },
  start_availability: {
    kind: 'option',
    weight: 3,
    optionPoints: {
      'فوراً': 1,
      'خلال أسبوع': 0.85,
      'خلال أسبوعين': 0.6,
      'أكتر من أسبوعين': 0.3,
    },
  },
  seriousness_pitch: {
    kind: 'text',
    weight: 4,
    minLength: 50,
    keywords: ['التزام', 'جدية', 'مبيعات', 'نتائج', 'سرعة', 'إقناع', 'خبرة', 'مستعد', 'أثبت'],
  },
};

// إجابات بتستدعي انتباه (مش مناسبة للدور) → بتظهر كتحذير للأدمن
// المفتاح = id السؤال، والقيمة = { label للعرض، الخيارات اللي بتتفلَج }
const MODERATOR_RED_FLAGS: Record<string, { label: string; options: string[] }> = {
  has_laptop: { label: 'اللاب توب/الإنترنت', options: ['لأ', 'لسه هحتاج أوفّر لاب توب'] },
  contract_commitment: { label: 'الالتزام بالعقد', options: ['مش متأكد'] },
  conduct_acknowledgement: { label: 'إقرار المهنية', options: ['لأ'] },
  training_commitment: { label: 'الالتزام بالتدريب', options: ['مش مناسب ليا'] },
  speed_triage: { label: 'التعامل مع ضغط الشات', options: ['بيحصلي ضغط وبتلخبط'] },
};

// ===================== سجل التقييم لكل الوظائف =====================
export const JOB_SCORING: Record<string, Record<string, QuestionScoring>> = {
  moderator: MODERATOR_SCORING,
};

const JOB_RED_FLAGS: Record<string, Record<string, { label: string; options: string[] }>> = {
  moderator: MODERATOR_RED_FLAGS,
};

export function hasScoring(jobSlug: string): boolean {
  return !!JOB_SCORING[jobSlug];
}

// ===================== محرك الحساب =====================
function textFraction(value: string, sc: QuestionScoring): number {
  const v = value.trim();
  if (!v) return 0;
  const minLen = sc.minLength ?? 40;
  const lengthFrac = Math.min(1, v.length / minLen);
  if (sc.keywords && sc.keywords.length > 0) {
    const lower = v.toLowerCase();
    const matched = sc.keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const target = Math.min(sc.keywords.length, 4); // إيجاد ~4 كلمات = درجة كلمات كاملة
    const kwFrac = Math.min(1, matched / target);
    return Math.min(1, 0.5 * lengthFrac + 0.5 * kwFrac);
  }
  return lengthFrac;
}

function numberFraction(value: string, sc: QuestionScoring): number {
  const digits = value.replace(/[^\d.]/g, '');
  if (!digits) return 0;
  const num = parseFloat(digits);
  if (!isFinite(num) || num <= 0) return 0;
  const threshold = sc.goodNumberThreshold ?? 1;
  return Math.min(1, num / threshold);
}

function urlFraction(value: string): number {
  const v = value.trim();
  if (!v) return 0;
  return /^https?:\/\//i.test(v) ? 1 : 0.5;
}

function questionFraction(rawValue: string | undefined, sc: QuestionScoring): number {
  const v = (rawValue ?? '').trim();
  switch (sc.kind) {
    case 'option':
      return v ? sc.optionPoints?.[v] ?? 0 : 0;
    case 'text':
      return textFraction(v, sc);
    case 'number':
      return numberFraction(v, sc);
    case 'url':
      return urlFraction(v);
    case 'presence':
      return v ? 1 : 0;
    default:
      return 0;
  }
}

const EMPTY_SCORE: ApplicationScore = {
  percent: 0,
  earned: 0,
  max: 0,
  answeredScored: 0,
  totalScored: 0,
  breakdown: [],
  flags: [],
  hasScoring: false,
};

export function scoreApplication(
  jobSlug: string,
  answers: Record<string, string> | null | undefined
): ApplicationScore {
  const config = JOB_SCORING[jobSlug];
  if (!config) return EMPTY_SCORE;

  const a = answers || {};
  const redCfg = JOB_RED_FLAGS[jobSlug] || {};

  let earned = 0;
  let max = 0;
  let answeredScored = 0;
  let totalScored = 0;
  const breakdown: ScoreBreakdownItem[] = [];
  const flags: string[] = [];

  for (const [id, sc] of Object.entries(config)) {
    const raw = a[id];
    const answered = !!(raw && raw.trim());

    // تحذيرات (تتحسب حتى لو الوزن 0)
    const red = redCfg[id];
    const isRedFlag = answered && !!red && red.options.includes((raw as string).trim());
    if (isRedFlag && red) flags.push(`${red.label}: «${(raw as string).trim()}»`);

    if (sc.weight <= 0) continue; // بيانات فقط

    totalScored += 1;
    max += sc.weight;
    if (answered) answeredScored += 1;

    const fraction = questionFraction(raw, sc);
    const itemEarned = sc.weight * fraction;
    earned += itemEarned;

    breakdown.push({ id, weight: sc.weight, fraction, earned: itemEarned, answered, isRedFlag });
  }

  const percent = max > 0 ? Math.round((earned / max) * 100) : 0;
  return { percent, earned, max, answeredScored, totalScored, breakdown, flags, hasScoring: true };
}

// ===================== مساعدات العرض =====================
export function scoreTier(percent: number): { label: string; color: string; text: string } {
  if (percent >= 80) return { label: 'ممتاز', color: 'bg-green-500/20 text-green-400', text: 'text-green-400' };
  if (percent >= 60) return { label: 'جيد جداً', color: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-300' };
  if (percent >= 40) return { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400', text: 'text-yellow-400' };
  if (percent >= 20) return { label: 'ضعيف', color: 'bg-orange-500/20 text-orange-400', text: 'text-orange-400' };
  return { label: 'ضعيف جداً', color: 'bg-red-500/20 text-red-400', text: 'text-red-400' };
}
