// src/lib/ai-scorer.ts
// تقييم الأسئلة المفتوحة بالذكاء الاصطناعي.
//
// الواجهة (AiScorer) متجرّدة عن المزود عن قصد: دلوقتي Gemini، ولو اتغيّر المزود
// بعدين مش هيتغير أي حاجة في محرك التقييم (scoring-v2.ts) ولا في الـAPI.
//
// لو مفيش GEMINI_API_KEY أو الـcall فشلت/اتأخرت → بنرجع لتقييم محلي تقريبي
// (heuristic) والطلب بيتعلّم needsRescore عشان الأدمن يعيد التقييم بزرار.

import { GoogleGenAI, Type } from '@google/genai';

export interface AiScoreRequest {
  questionId: string;
  /** نص السؤال زي ما المتقدمة شافته. */
  label: string;
  /** تعليمات التقييم من الـJSON. */
  rubric: string;
  /** الدرجة القصوى = وزن السؤال. */
  maxScore: number;
  answer: string;
}

export interface AiScoreItem {
  score: number;
  reason: string;
}

export interface AiScoreOutcome {
  scores: Record<string, AiScoreItem>;
  provider: 'gemini' | 'heuristic';
  model?: string;
  /** true = التقييم تقريبي ومحتاج إعادة بالـAI. */
  needsRescore: boolean;
  error?: string;
}

export interface AiScorer {
  readonly name: string;
  isAvailable(): boolean;
  score(items: AiScoreRequest[]): Promise<AiScoreOutcome>;
}

// ===================== تقييم محلي تقريبي (fallback) =====================
// مش بديل عن الـAI — بيقيس الاكتمال والتنظيم بس (طول + إشارات بنية).
// موجود عشان الطلب ميضيعش لو الـAI مش متاح.

const LIST_MARKER = /(^|\n)\s*(\(?[0-9٠-٩]{1,2}[\).\-–]|[-•*])\s+/;
const SENTENCE_SPLIT = /[.!؟?\n]+/;

function heuristicFraction(answer: string, maxScore: number): number {
  const text = answer.trim();
  if (!text) return 0;

  // الأسئلة التقيلة (وزن أكبر) متوقع منها إجابة أطول
  const targetChars = 60 + maxScore * 10;
  const lengthFrac = Math.min(1, text.length / targetChars);

  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(SENTENCE_SPLIT).filter((s) => s.trim().length > 8).length;

  const signals = [
    /[0-9٠-٩]/.test(text), // فيها أرقام/تفاصيل محددة
    LIST_MARKER.test(text) || sentences >= 3, // منظّمة (نقط أو أكتر من جملة)
    words >= 30, // فيها مضمون مش رد مقتضب
  ].filter(Boolean).length;

  const richnessFrac = signals / 3;
  return Math.max(0, Math.min(1, 0.65 * lengthFrac + 0.35 * richnessFrac));
}

export function heuristicScore(items: AiScoreRequest[]): AiScoreOutcome {
  const scores: Record<string, AiScoreItem> = {};
  for (const item of items) {
    const frac = heuristicFraction(item.answer, item.maxScore);
    scores[item.questionId] = {
      score: Math.round(item.maxScore * frac * 10) / 10,
      reason: 'تقييم تقريبي محلي (الذكاء الاصطناعي مش متاح) — محتاج إعادة تقييم.',
    };
  }
  return { scores, provider: 'heuristic', needsRescore: true };
}

// ===================== مزود Gemini =====================

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 25_000;

const SYSTEM_INSTRUCTION = `أنت مقيّم توظيف محترف بيقيّم إجابات متقدمات لوظيفة "مودريتور خدمة عملاء ومبيعات بالشات" في شركة مصرية بتشتغل في كتابة السير الذاتية.

قواعد التقييم:
1. طبّق تعليمات التقييم (rubric) بتاعة كل سؤال حرفيًا. الـrubric هو القانون — لو حدد درجات لحالات معينة، التزم بيها بالظبط.
2. الإجابات بالعامية المصرية. العامية أو الأخطاء الإملائية مش عيب في حد ذاتها؛ قيّم المضمون.
3. الإجابة الفاضية أو اللي مش ليها علاقة بالسؤال = 0.
4. الإجابة العامة المرسلة من غير تفاصيل محددة بتاخد أقل من نص الدرجة.
5. متكافئش الإجابة الطويلة لمجرد إنها طويلة، ولا تعاقب القصيرة لو كانت دقيقة ومطابقة للمطلوب.
6. لو الإجابة شكلها منسوخة من مصدر عام ومش مخصوصة للسؤال، نزّل الدرجة.
7. الدرجة لازم تكون بين 0 و maxScore بتاع السؤال (ممكن تكون بكسر عشري واحد).
8. اكتب سبب مختصر جدًا بالعربي (سطر واحد، 15 كلمة كحد أقصى) يوضّح ليه الدرجة دي.

رجّع JSON بس، من غير أي كلام زيادة.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ['questionId', 'score', 'reason'],
      },
    },
  },
  required: ['results'],
};

function buildPrompt(items: AiScoreRequest[]): string {
  const blocks = items.map((item, i) => {
    return [
      `### سؤال ${i + 1}`,
      `questionId: ${item.questionId}`,
      `maxScore: ${item.maxScore}`,
      `نص السؤال:`,
      item.label,
      `تعليمات التقييم (rubric):`,
      item.rubric,
      `إجابة المتقدمة:`,
      '"""',
      item.answer.trim() || '(مفيش إجابة)',
      '"""',
    ].join('\n');
  });

  return [
    `قيّم الإجابات دي. عدد الأسئلة: ${items.length}.`,
    'رجّع عنصر واحد لكل سؤال في مصفوفة results بنفس الـquestionId.',
    '',
    ...blocks,
  ].join('\n\n');
}

class GeminiScorer implements AiScorer {
  readonly name = 'gemini';

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined;
  }

  private get model(): string {
    return process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async score(items: AiScoreRequest[]): Promise<AiScoreOutcome> {
    if (items.length === 0) {
      return { scores: {}, provider: 'gemini', model: this.model, needsRescore: false };
    }

    const apiKey = this.apiKey;
    if (!apiKey) {
      return { ...heuristicScore(items), error: 'GEMINI_API_KEY مش موجود' };
    }

    const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: this.model,
        contents: buildPrompt(items),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          abortSignal: controller.signal,
        },
      });

      const raw = response.text;
      if (!raw) throw new Error('رد فاضي من Gemini');

      const parsed = JSON.parse(raw) as {
        results?: Array<{ questionId?: string; score?: number; reason?: string }>;
      };
      const results = parsed.results || [];

      const byId = new Map(results.filter((r) => r.questionId).map((r) => [r.questionId!, r]));

      const scores: Record<string, AiScoreItem> = {};
      const missing: AiScoreRequest[] = [];

      for (const item of items) {
        const hit = byId.get(item.questionId);
        if (!hit || typeof hit.score !== 'number' || !isFinite(hit.score)) {
          missing.push(item);
          continue;
        }
        // بنقصّ الدرجة على مدى السؤال مهما رجّع الموديل
        const clamped = Math.max(0, Math.min(item.maxScore, hit.score));
        scores[item.questionId] = {
          score: Math.round(clamped * 10) / 10,
          reason: (hit.reason || '').trim().slice(0, 200),
        };
      }

      // أي سؤال الموديل نساه بياخد التقييم التقريبي بدل ما يضيع
      if (missing.length > 0) {
        const fallback = heuristicScore(missing);
        Object.assign(scores, fallback.scores);
      }

      return {
        scores,
        provider: 'gemini',
        model: this.model,
        needsRescore: missing.length > 0,
        error: missing.length > 0 ? `${missing.length} سؤال رجعوا من غير درجة` : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[ai-scorer] Gemini failed:', message);
      return { ...heuristicScore(items), error: message };
    } finally {
      clearTimeout(timer);
    }
  }
}

let cached: AiScorer | null = null;

/** المزود الحالي — سطر واحد يتغير لو المزود اتبدّل. */
export function getAiScorer(): AiScorer {
  if (!cached) cached = new GeminiScorer();
  return cached;
}

export function isAiScoringAvailable(): boolean {
  return getAiScorer().isAvailable();
}
