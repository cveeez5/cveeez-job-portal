// src/lib/ai-scorer.ts
// تقييم الأسئلة المفتوحة بالذكاء الاصطناعي.
//
// الواجهة (AiScorer) متجرّدة عن المزود عن قصد، وجواها سلسلة محاولات مرتّبة:
// لو المحاولة وقعت (حصة خلصت / مفتاح متحظر / السيرفر واقع / timeout) بننتقل
// للي بعدها أوتوماتيك. لو كلهم وقعوا بنرجع لتقييم محلي تقريبي (heuristic)
// والطلب بيتعلّم needsRescore عشان الأدمن يعيد التقييم بزرار.
//
// ترتيب السلسلة بيتبني من متغيرات البيئة (تفاصيلها في .env.example):
//   1. GEMINI_API_KEY   + GEMINI_MODEL           (الأساسي)
//   2. GEMINI_API_KEY   + GEMINI_MODEL_FALLBACK  (نفس المفتاح، موديل أرخص)
//   3. GEMINI_API_KEY_2 + GEMINI_MODEL           (مفتاح جيمناي تاني)
//   4. FALLBACK_AI_*                             (أي مزود متوافق مع OpenAI)

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
  provider: 'gemini' | 'openai-compatible' | 'heuristic';
  model?: string;
  /** true = التقييم تقريبي ومحتاج إعادة بالـAI. */
  needsRescore: boolean;
  error?: string;
  /** المحاولات اللي وقعت قبل ما ينجح — بتبان للأدمن عشان يعرف إن في مفتاح واقع. */
  attempts?: string[];
}

export interface AiScorer {
  readonly name: string;
  isAvailable(): boolean;
  score(items: AiScoreRequest[]): Promise<AiScoreOutcome>;
}

// الموديلات الكبيرة بتاخد 20–50 ثانية على 10 أسئلة مفتوحة. التقييم بيجري في
// الخلفية بعد ما الرد يوصل للمتقدمة، فالانتظار ده مش بيأخّر حد.
const DEFAULT_TIMEOUT_MS = 45_000;

// ===================== تقييم محلي تقريبي (fallback) =====================
// مش بديل عن الـAI — بيقيس الاكتمال والتنظيم بس (طول + إشارات بنية).
// موجود عشان الطلب ميضيعش لو كل المزودين وقعوا.

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

// ===================== البرومبت المشترك =====================
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
9. مهم: الخصومات على الدرجة الإجمالية بيطبقها النظام لوحده بره تقييمك. متخصمش أنت أي درجات بسبب قاعدة عامة (زي إن الإجابة لازم تبدأ بكلمة معينة) — قيّم جودة محتوى الإجابة بس.

رجّع JSON بس، من غير أي كلام زيادة.`;

function buildPrompt(items: AiScoreRequest[]): string {
  const blocks = items.map((item, i) =>
    [
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
    ].join('\n')
  );

  return [
    `قيّم الإجابات دي. عدد الأسئلة: ${items.length}.`,
    'رجّع عنصر واحد لكل سؤال في مصفوفة results بنفس الـquestionId.',
    '',
    ...blocks,
  ].join('\n\n');
}

interface RawResult {
  questionId?: string;
  score?: number;
  reason?: string;
}

/**
 * موديلات كتير بتغلّف الـJSON في ```json أو بتسبقه بسطر كلام، خصوصاً لما الـ
 * response_format مش مدعوم. بنستخرج أول كائن JSON بدل ما الرد كله يضيع.
 */
function parseResults(text: string): RawResult[] {
  const attempt = (raw: string) => (JSON.parse(raw) as { results?: RawResult[] }).results;

  try {
    const direct = attempt(text);
    if (direct) return direct;
  } catch {
    // بنكمّل للاستخراج اليدوي
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('مفيش JSON في الرد');
  return attempt(body.slice(start, end + 1)) || [];
}

/** بنقصّ كل درجة على مدى سؤالها مهما رجّع الموديل، وبنرجّع اللي نقص. */
function collectScores(
  items: AiScoreRequest[],
  results: RawResult[]
): { scores: Record<string, AiScoreItem>; missing: AiScoreRequest[] } {
  const byId = new Map(results.filter((r) => r.questionId).map((r) => [r.questionId!, r]));
  const scores: Record<string, AiScoreItem> = {};
  const missing: AiScoreRequest[] = [];

  for (const item of items) {
    const hit = byId.get(item.questionId);
    if (!hit || typeof hit.score !== 'number' || !isFinite(hit.score)) {
      missing.push(item);
      continue;
    }
    const clamped = Math.max(0, Math.min(item.maxScore, hit.score));
    scores[item.questionId] = {
      score: Math.round(clamped * 10) / 10,
      reason: (hit.reason || '').trim().slice(0, 200),
    };
  }

  return { scores, missing };
}

// ===================== محاولة واحدة في السلسلة =====================
interface Attempt {
  label: string;
  provider: 'gemini' | 'openai-compatible';
  model: string;
  run(items: AiScoreRequest[], signal: AbortSignal): Promise<RawResult[]>;
}

const GEMINI_SCHEMA = {
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

function geminiAttempt(label: string, apiKey: string, model: string): Attempt {
  return {
    label,
    provider: 'gemini',
    model,
    async run(items, signal) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(items),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_SCHEMA,
          abortSignal: signal,
        },
      });
      const raw = response.text;
      if (!raw) throw new Error('رد فاضي من Gemini');
      return parseResults(raw);
    },
  };
}

/**
 * أي مزود بواجهة متوافقة مع OpenAI (OpenAI / OpenRouter / Groq / DeepSeek /
 * Together …) — كلهم بيقبلوا نفس /chat/completions فمحتاجين base URL وموديل بس.
 */
function openAiCompatibleAttempt(
  label: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Attempt {
  return {
    label,
    provider: 'openai-compatible',
    model,
    async run(items, signal) {
      const call = async (jsonMode: boolean): Promise<RawResult[]> => {
        const body: Record<string, unknown> = {
          model,
          temperature: 0,
          // من غير الحد ده بعض المزودين بيقصّوا الرد فبيرجع JSON ناقص
          max_tokens: 4096,
          messages: [
            {
              role: 'system',
              content: `${SYSTEM_INSTRUCTION}\n\nالشكل المطلوب: {"results":[{"questionId":"...","score":0,"reason":"..."}]}`,
            },
            { role: 'user', content: buildPrompt(items) },
          ],
        };
        if (jsonMode) body.response_format = { type: 'json_object' };

        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
          signal,
        });

        if (!res.ok) {
          const detail = (await res.text()).slice(0, 160);
          // موديلات كتير مش بتدعم response_format — بنعيد من غيره مرة واحدة
          if (jsonMode && (res.status === 400 || res.status === 422)) return call(false);
          throw new Error(`HTTP ${res.status} — ${detail}`);
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = json.choices?.[0]?.message?.content;
        if (!raw) throw new Error('رد فاضي من المزود الاحتياطي');
        return parseResults(raw);
      };

      return call(true);
    },
  };
}

// ===================== بناء السلسلة من متغيرات البيئة =====================
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';

function buildChain(): Attempt[] {
  const chain: Attempt[] = [];

  const key1 = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const key2 = process.env.GEMINI_API_KEY_2;
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const fallbackModel = process.env.GEMINI_MODEL_FALLBACK || DEFAULT_GEMINI_FALLBACK_MODEL;

  if (key1) {
    chain.push(geminiAttempt(`gemini:${model}`, key1, model));
    // نفس المفتاح بموديل تاني — بيغطي حالة إن الحصة خلصت على موديل واحد بس
    if (fallbackModel && fallbackModel !== model) {
      chain.push(geminiAttempt(`gemini:${fallbackModel}`, key1, fallbackModel));
    }
  }

  if (key2) {
    chain.push(geminiAttempt(`gemini2:${model}`, key2, model));
  }

  const fbKey = process.env.FALLBACK_AI_API_KEY;
  const fbUrl = process.env.FALLBACK_AI_BASE_URL;
  const fbModel = process.env.FALLBACK_AI_MODEL;
  const fbModel2 = process.env.FALLBACK_AI_MODEL_2;

  if (fbKey && fbUrl && fbModel) {
    chain.push(openAiCompatibleAttempt(`fallback:${fbModel}`, fbKey, fbUrl, fbModel));
    // موديل تاني على نفس المزود — بيغطي حالة إن الأول واقع أو مزحوم
    if (fbModel2 && fbModel2 !== fbModel) {
      chain.push(openAiCompatibleAttempt(`fallback:${fbModel2}`, fbKey, fbUrl, fbModel2));
    }
  }

  return chain;
}

// ===================== المنسّق =====================
class ChainedScorer implements AiScorer {
  readonly name = 'chained';

  isAvailable(): boolean {
    return buildChain().length > 0;
  }

  async score(items: AiScoreRequest[]): Promise<AiScoreOutcome> {
    const chain = buildChain();

    if (items.length === 0) {
      return {
        scores: {},
        provider: chain[0]?.provider ?? 'heuristic',
        model: chain[0]?.model,
        needsRescore: false,
      };
    }

    if (chain.length === 0) {
      return { ...heuristicScore(items), error: 'مفيش أي مفتاح ذكاء اصطناعي متظبط' };
    }

    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    const failures: string[] = [];

    for (const attempt of chain) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const results = await attempt.run(items, controller.signal);
        const { scores, missing } = collectScores(items, results);

        // لو الموديل نسي كل حاجة نعتبرها محاولة فاشلة ونجرب اللي بعده
        if (missing.length === items.length) {
          throw new Error('كل الأسئلة رجعت من غير درجة');
        }

        // أي سؤال ناقص بياخد التقييم التقريبي بدل ما يضيع
        if (missing.length > 0) {
          Object.assign(scores, heuristicScore(missing).scores);
        }

        return {
          scores,
          provider: attempt.provider,
          model: attempt.model,
          needsRescore: missing.length > 0,
          error: missing.length > 0 ? `${missing.length} سؤال رجعوا من غير درجة` : undefined,
          attempts: failures.length > 0 ? failures : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ai-scorer] ${attempt.label} فشل:`, message);
        failures.push(`${attempt.label}: ${message.slice(0, 120)}`);
      } finally {
        clearTimeout(timer);
      }
    }

    // كل المزودين وقعوا
    return {
      ...heuristicScore(items),
      error: failures.join(' | ').slice(0, 500),
      attempts: failures,
    };
  }
}

let cached: AiScorer | null = null;

export function getAiScorer(): AiScorer {
  if (!cached) cached = new ChainedScorer();
  return cached;
}

export function isAiScoringAvailable(): boolean {
  return getAiScorer().isAvailable();
}

/** أسماء المحاولات المتظبطة — للتشخيص من الأدمن. */
export function aiChainLabels(): string[] {
  return buildChain().map((a) => a.label);
}
