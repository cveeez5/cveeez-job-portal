/**
 * بنشمارك لاختيار موديل التقييم.
 *
 * كل حالة هنا إجابتها الصح معروفة مقدمًا من الـrubric نفسه، فبنقيس فعليًا
 * أنهي موديل بيلتزم بالـrubric مش أنهي موديل «شكله أحدث».
 *
 * جيمناي:
 *   GEMINI_API_KEY=xxx node scripts/bench-scoring.mjs gemini-3.6-flash gemini-2.5-flash
 *
 * أي مزود متوافق مع OpenAI (NVIDIA NIM / OpenRouter / Groq / OpenAI …):
 *   node scripts/bench-scoring.mjs --openai https://integrate.api.nvidia.com/v1 \
 *        --key nvapi-xxx  moonshotai/kimi-k2.6  z-ai/glm-5.2
 *
 * الناتج: دقة (عدد الحالات جوه الهامش المقبول) + متوسط الخطأ + الزمن + التوكنز.
 * حط الفايز في GEMINI_MODEL أو FALLBACK_AI_MODEL.
 */

const argv = process.argv.slice(2);
function takeFlag(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const [, value] = argv.splice(i, 2);
  return value;
}

const OPENAI_BASE = takeFlag('--openai');
const CLI_KEY = takeFlag('--key');
const KEY = CLI_KEY || (OPENAI_BASE ? process.env.FALLBACK_AI_API_KEY : process.env.GEMINI_API_KEY);

if (!KEY) {
  console.error(OPENAI_BASE ? 'محتاج --key أو FALLBACK_AI_API_KEY' : 'محتاج GEMINI_API_KEY');
  process.exit(1);
}

const ENDPOINT = (m) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const SYSTEM = `أنت مقيّم توظيف محترف بيقيّم إجابات متقدمات لوظيفة "مودريتور خدمة عملاء ومبيعات بالشات" في شركة مصرية بتشتغل في كتابة السير الذاتية.

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

const W1_LABEL = `عميل بعتلك الرسالة دي على الواتساب:
«مساء الخير، أنا محتاج CV بالإنجليزي يعدي على أنظمة ATS، وكمان كوفر ليتر، وياريت يكون جاهز قبل الخميس عشان في وظيفة هقدم عليها، وممكن تبعتوهولي على الإيميل مش على الواتس؟»
السؤال: العميل طلب كام طلب بالظبط؟ اكتبيهم مرقمين واحد واحد.`;
const W1_RUBRIC =
  'الإجابة الصح فيها 4 طلبات: (1) CV إنجليزي ATS (2) كوفر ليتر (3) التسليم قبل الخميس (4) الإرسال على الإيميل مش الواتس. 4 صح = 15 · 3 = 10 · 2 = 5 · أقل = 0. ده أهم سؤال في الفورم لأنه بيقيس اتباع التعليمات والدقة — وده أساس شغلنا كله.';

const W2_LABEL = `اقري السطور دي من سيرة ذاتية بالإنجليزي:
"Senior Sales Executive — ABC Trading Co., Cairo
Jan 2021 – Present
Managed a portfolio of 40+ B2B accounts and exceeded quarterly targets by 18%."
جاوبي بالعربي: (1) الشخص ده وظيفته إيه؟ (2) شغال في الشركة دي من إمتى ولحد إمتى؟ (3) إيه أهم نتيجة حققها؟`;
const W2_RUBRIC =
  '3 إجابات صح = 10 · 2 = 6 · 1 = 3 · غلط أو ترجمة حرفية من غير فهم = 0. بيقيس فهم الإنجليزي عمليًا بدل ما نسألها تقيّم نفسها.';

const W4_LABEL =
  'عميلة قالتلك: «السعر غالي عليا» أو «هفكر وأرجعلك». اكتبي بالظبط هتردي إزاي.';
const W4_RUBRIC =
  'الرد الكويس: ما بيتنازلش عن السعر فورًا، بيعيد صياغة القيمة، بيسأل سؤال يفتح الحوار تاني. الرد الضعيف: (تمام يا فندم في انتظارك) أو تخفيض فوري.';

const E2_LABEL =
  'لو اشتغلتي قبل كده: اكتبي أسماء الشركات ودورك في كل واحدة ومدة شغلك، وأهم نتيجة حققتيها. (بنتأكد منها في المقابلة)';
const E2_RUBRIC =
  'تفاصيل محددة (اسم شركة + مدة + نتيجة) = 6. كلام عام من غير تفاصيل = 2. مفيش خبرة بس الإجابة صادقة وواضحة = 3.';

// [id, label, rubric, max, answer, الدرجة الصح, الهامش المقبول]
const CASES = [
  ['w1_all4', W1_LABEL, W1_RUBRIC, 15,
    '1) CV بالإنجليزي يعدي على ATS\n2) كوفر ليتر\n3) يكون جاهز قبل الخميس\n4) يتبعت على الإيميل مش الواتس', 15, 1],
  ['w1_only3', W1_LABEL, W1_RUBRIC, 15,
    '1) CV إنجليزي ATS\n2) كوفر ليتر\n3) قبل الخميس', 10, 1.5],
  ['w1_only2', W1_LABEL, W1_RUBRIC, 15, '1) سي في بالإنجليزي\n2) كوفر ليتر', 5, 1.5],
  ['w1_junk', W1_LABEL, W1_RUBRIC, 15, 'العميل عايز سيرة ذاتية حلوة وانا هعملهاله', 0, 2],
  ['w2_all3', W2_LABEL, W2_RUBRIC, 10,
    '1) مسؤول مبيعات أول في شركة ABC Trading بالقاهرة\n2) من يناير 2021 ولحد دلوقتي\n3) دار محفظة 40 عميل وعدى التارجت الربع سنوي بـ18%', 10, 1],
  ['w2_only1', W2_LABEL, W2_RUBRIC, 10, '1) هو مسؤول مبيعات', 3, 1.5],
  ['w4_weak', W4_LABEL, W4_RUBRIC, 10, 'تمام يا فندم في انتظارك', 1, 2],
  ['w4_strong', W4_LABEL, W4_RUBRIC, 10,
    'أتفهم إن الميزانية مهمة، بس الـCV ده هتستخدميه في كل تقديم للسنة الجاية كلها مش مرة واحدة. اللي بيغلى فعلًا هو إنك تفضلي مقدمة 3 شهور من غير رد. ممكن أعرف إيه اللي واقف معاكي بالظبط: السعر نفسه ولا مش متأكدة من النتيجة؟', 9, 1.5],
  ['e2_none', E2_LABEL, E2_RUBRIC, 6, 'لسه مشتغلتش قبل كده', 3, 1],
  ['e2_vague', E2_LABEL, E2_RUBRIC, 6, 'اشتغلت في كذا مكان وكنت شاطرة جدا', 2, 1],
  ['e2_detailed', E2_LABEL, E2_RUBRIC, 6,
    'شركة برايم للتسويق — خدمة عملاء شات — سنة وشهرين — رفعت نسبة الرد خلال 5 دقايق من 60% لـ92%.', 6, 1],
];

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    results: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          questionId: { type: 'STRING' },
          score: { type: 'NUMBER' },
          reason: { type: 'STRING' },
        },
        required: ['questionId', 'score', 'reason'],
      },
    },
  },
  required: ['results'],
};

const prompt = [
  `قيّم الإجابات دي. عدد الأسئلة: ${CASES.length}.`,
  'رجّع عنصر واحد لكل سؤال في مصفوفة results بنفس الـquestionId.',
  '',
  ...CASES.map(([id, label, rubric, max, answer], i) =>
    `### سؤال ${i + 1}\nquestionId: ${id}\nmaxScore: ${max}\nنص السؤال:\n${label}\nتعليمات التقييم (rubric):\n${rubric}\nإجابة المتقدمة:\n"""\n${answer}\n"""`),
].join('\n\n');

/** بعض الموديلات بتغلّف الـJSON في ```json أو بتسبقه بكلام — بنستخرجه. */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('مفيش JSON في الرد');
  return JSON.parse(body.slice(start, end + 1));
}

async function callGemini(model) {
  const res = await fetch(ENDPOINT(model), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 140)}`);
  const json = await res.json();
  return {
    text: json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '',
    tokens: json.usageMetadata?.totalTokenCount,
  };
}

async function callOpenAiCompatible(model, jsonMode = true) {
  const body = {
    model,
    temperature: 0,
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `${SYSTEM}\n\nالشكل المطلوب: {"results":[{"questionId":"...","score":0,"reason":"..."}]}`,
      },
      { role: 'user', content: prompt },
    ],
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(`${OPENAI_BASE.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    // موديلات كتير مش بتدعم response_format — بنعيد من غيره
    if (jsonMode && (res.status === 400 || res.status === 422)) {
      return callOpenAiCompatible(model, false);
    }
    throw new Error(`HTTP ${res.status} ${detail}`);
  }

  const json = await res.json();
  return {
    text: json.choices?.[0]?.message?.content || '',
    tokens: json.usage?.total_tokens,
    jsonMode,
  };
}

async function run(model) {
  const started = Date.now();
  try {
    const { text, tokens, jsonMode } = OPENAI_BASE
      ? await callOpenAiCompatible(model)
      : await callGemini(model);
    const ms = Date.now() - started;
    const byId = new Map(extractJson(text).results.map((r) => [r.questionId, r]));

    let totalError = 0;
    let within = 0;
    const rows = [];
    for (const [id, , , max, , expected, tolerance] of CASES) {
      const got = byId.get(id)?.score;
      if (typeof got !== 'number') {
        rows.push([id, expected, 'ناقص', 'off']);
        totalError += max;
        continue;
      }
      const error = Math.abs(got - expected);
      totalError += error;
      if (error <= tolerance) within++;
      rows.push([id, expected, got, error <= tolerance ? 'ok' : 'off']);
    }

    return {
      model,
      ms,
      mae: +(totalError / CASES.length).toFixed(2),
      within,
      of: CASES.length,
      rows,
      tokens,
      jsonMode,
    };
  } catch (error) {
    return { model, ms: Date.now() - started, error: String(error.message).slice(0, 180) };
  }
}

const models = argv;
if (models.length === 0) {
  console.error('اكتب اسم موديل أو أكتر، مثال: node scripts/bench-scoring.mjs gemini-3.6-flash gemini-2.5-flash');
  process.exit(1);
}

const results = [];
for (const model of models) {
  const result = await run(model);
  results.push(result);
  if (result.error) {
    console.log(`\n❌ ${model.padEnd(26)} ${result.ms}ms  ${result.error}`);
    continue;
  }
  console.log(
    `\n✅ ${model.padEnd(34)} ${String(result.ms).padStart(6)}ms  دقة ${result.within}/${result.of}  متوسط الخطأ ${result.mae}  توكنز ${result.tokens ?? '?'}${result.jsonMode === false ? '  (من غير json mode)' : ''}`
  );
  for (const [id, expected, got, ok] of result.rows) {
    console.log(`     ${ok === 'ok' ? '·' : '⚠'} ${id.padEnd(12)} صح=${expected}  الموديل=${got}`);
  }
}

const ok = results.filter((r) => !r.error);
if (ok.length > 0) {
  console.log('\n\n=========== الترتيب ===========');
  ok.sort((a, b) => b.within - a.within || a.mae - b.mae || a.ms - b.ms).forEach((r, i) =>
    console.log(`${i + 1}. ${r.model.padEnd(34)} دقة ${r.within}/${r.of}  خطأ ${r.mae}  ${r.ms}ms`)
  );
}
