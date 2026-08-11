// src/lib/moderator-v2.ts
// تعريف فورم المودريتور v2 — المصدر الوحيد للأسئلة والصياغة والأوزان وقواعد الاستبعاد.
// أي تعديل في نص سؤال أو خيار لازم يتعمل هنا بس (الفرونت والسيرفر والأدمن كلهم بيقروا منه).
//
// النسخة القديمة (v1) سايبينها زي ما هي في constants.ts → JOB_QUESTIONS.moderator
// والطلبات المتسجّلة بـ formVersion = 1 بتتعرض منها من غير ما تتأثر بأي حاجة هنا.

export const MODERATOR_FORM_VERSION = 2;

export type V2QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'number'
  | 'tel'
  | 'email';

export interface V2Option {
  value: string;
  label: string;
  /** درجة الخيار (للأسئلة اللي وزنها > 0) — بتتاخد زي ما هي. */
  score?: number;
  /** استبعاد فوري: وقف الفورم + REJECTED_AUTO. */
  knockout?: boolean;
  /** مش استبعاد — بيتسجّل في flags[] ويبان للأدمن. */
  flag?: boolean;
}

export interface V2Question {
  id: string;
  type: V2QuestionType;
  label: string;
  required: boolean;
  /** وزن السؤال في الدرجة. 0 أو undefined = بيانات فقط (بتتعرض للأدمن ومتتحسبش). */
  weight?: number;
  hint?: string;
  /** تعليمات تقييم الأسئلة المفتوحة — بتتبعت للـAI كـrubric. */
  rubric?: string;
  options?: V2Option[];
}

/** أقسام التقييم زي ما هي في الـJSON (الدرجات بتتجمّع بالقسم). */
export type V2SectionId = 'gate' | 'basics' | 'experience' | 'worksample' | 'ai' | 'commitment';

export interface V2Section {
  id: V2SectionId;
  title: string;
  intro?: string;
  weight: number;
  questions: V2Question[];
}

/**
 * الأقسام بترتيب الـJSON الأصلي — سايبينه زي ما هو عشان يفضل سهل نطابقه بالمصدر.
 * ترتيب العرض الفعلي في MODERATOR_V2_SECTIONS تحت.
 *
 * ملاحظة تطوير من الـJSON: knockout = استبعاد فوري ورسالة اعتذار مهذبة ووقف الفورم.
 */
const SECTIONS_IN_JSON_ORDER: V2Section[] = [
  // ===================== 1) بوابة الفلترة =====================
  {
    id: 'gate',
    title: 'قبل ما تبدئي — 5 أسئلة سريعة',
    intro:
      'الأسئلة دي بتوفر وقتك ووقتنا. لو إجابتك على أي واحدة فيهم مش مناسبة، الوظيفة دي مش ليكي وهنقولك على طول.',
    weight: 0,
    questions: [
      {
        id: 'g1',
        type: 'radio',
        required: true,
        label:
          'الوظيفة دي حضوري من مقر سوهاج (الشرق — جمب جامعة سوهاج، بجوار قاعة البارون)، الشيفت الصباحي 9ص–5م من المكتب، 6 أيام في الأسبوع والجمعة أجازة. تقدري تحضري يوميًا؟',
        options: [
          { value: 'yes', label: 'آه أقدر أحضر يوميًا' },
          { value: 'no', label: 'لأ، بدور على شغل من البيت بس', knockout: true },
          { value: 'far', label: 'سكني بعيد ومش هقدر ألتزم يوميًا', knockout: true },
        ],
      },
      {
        id: 'g2',
        type: 'radio',
        required: true,
        label:
          'نظام الأجر بالترتيب: 15 يوم تدريب بمكافأة رمزية ← شهر اختبار بـ1500ج + عمولة ← التثبيت بـ3000ج ثابت + عمولة من 3% لـ7% + بونص انتظام + زيادة بعد 3 شهور. النظام ده ثابت ومش قابل للتفاوض. موافقة؟',
        options: [
          { value: 'yes', label: 'آه موافقة تمامًا' },
          { value: 'negotiate', label: 'محتاجة أتفاوض على المرتب', knockout: true },
          { value: 'no', label: 'لأ مش مناسب ليا', knockout: true },
        ],
      },
      {
        id: 'g3',
        type: 'radio',
        required: true,
        label: 'معاكي لابتوب شخصي شغال + نت ثابت في البيت (مهم للشيفت المسائي)؟',
        options: [
          { value: 'both', label: 'آه، لابتوب خاص + نت ثابت + مكان هادي' },
          { value: 'laptop_only', label: 'معايا لابتوب بس النت أو المكان مش مظبوط', flag: true },
          { value: 'none', label: 'لسه هحتاج أوفّر لابتوب', knockout: true },
        ],
      },
      {
        id: 'g4',
        type: 'radio',
        required: true,
        label: 'مؤهلك الدراسي؟',
        options: [
          { value: 'bachelor', label: 'مؤهل عالي — خريجة' },
          { value: 'postgrad', label: 'دراسات عليا' },
          { value: 'student', label: 'لسه طالبة', knockout: true },
          { value: 'diploma', label: 'مؤهل متوسط / دبلوم', knockout: true },
        ],
      },
      {
        id: 'g5',
        type: 'radio',
        required: true,
        label: 'عندك دراسة أو شغل تاني أو أي ارتباط ثابت بياخد من وقت الشغل؟',
        options: [
          { value: 'free', label: 'متفرغة تمامًا' },
          {
            value: 'busy',
            label: 'عندي ارتباط ثابت (دراسة / شغل تاني / دروس)',
            knockout: true,
          },
        ],
      },
    ],
  },

  // ===================== 2) بياناتك =====================
  {
    id: 'basics',
    title: 'بياناتك',
    weight: 0,
    questions: [
      { id: 'b1', type: 'text', label: 'الاسم الكامل', required: true },
      // ملاحظة: سؤال البريد مش موجود في الـJSON — اتضاف بموافقة صريحة عشان
      // عمود email في الداتابيز مطلوب والطلبات القديمة معتمدة عليه.
      { id: 'b_email', type: 'email', label: 'البريد الإلكتروني', required: true },
      { id: 'b2', type: 'number', label: 'سنك كام؟', required: true },
      { id: 'b3', type: 'tel', label: 'رقم الواتساب', required: true },
      { id: 'b4', type: 'tel', label: 'رقم تاني للتواصل', required: false },
      {
        id: 'b5',
        type: 'text',
        label: 'عنوانك بالتفصيل (المدينة / الحي / أقرب معلم مشهور)',
        required: true,
      },
      {
        id: 'b6',
        type: 'textarea',
        required: true,
        label: 'هتيجي المقر إزاي وهتاخد منك كام دقيقة تقريبًا؟ (وسيلة المواصلات + الوقت)',
        hint: 'مثال: من أخميم بميكروباص، حوالي 25 دقيقة',
        rubric:
          'إجابة محددة فيها وسيلة ووقت = جدية. إجابة زي (مش عارفة / هدبر) = ما فكرتش في الموضوع.',
      },
      { id: 'b7', type: 'text', label: 'مؤهلك وتخصصك وسنة التخرج', required: true },
      {
        id: 'b8',
        type: 'select',
        label: 'عرفتي عن الوظيفة منين؟',
        required: true,
        options: [
          { value: 'فيسبوك', label: 'فيسبوك' },
          { value: 'تليجرام', label: 'تليجرام' },
          { value: 'إنستجرام', label: 'إنستجرام' },
          { value: 'صديقة / معرفة', label: 'صديقة / معرفة' },
          { value: 'صفحة CVeeez', label: 'صفحة CVeeez' },
          { value: 'غير كده', label: 'غير كده' },
        ],
      },
    ],
  },

  // ===================== 3) الخبرة =====================
  {
    id: 'experience',
    title: 'خبرتك (اختياري — مش شرط تكوني اشتغلتي قبل كده)',
    weight: 10,
    questions: [
      {
        id: 'e1',
        type: 'select',
        required: true,
        weight: 4,
        label: 'عندك كام سنة خبرة في خدمة عملاء أو مبيعات أو رد على عملاء بالشات؟',
        options: [
          { value: 'none', label: 'من غير خبرة', score: 0 },
          { value: 'lt1', label: 'أقل من سنة', score: 2 },
          { value: '1_2', label: 'من سنة لسنتين', score: 3 },
          { value: '3_5', label: 'من 3 لـ5 سنين', score: 4 },
          { value: 'gt5', label: 'أكتر من 5 سنين', score: 4 },
        ],
      },
      {
        id: 'e2',
        type: 'textarea',
        required: false,
        weight: 6,
        label:
          'لو اشتغلتي قبل كده: اكتبي أسماء الشركات ودورك في كل واحدة ومدة شغلك، وأهم نتيجة حققتيها. (بنتأكد منها في المقابلة)',
        hint: 'لو مشتغلتيش قبل كده اكتبي: لسه مشتغلتش — ومش هيأثر على قبولك',
        rubric:
          'تفاصيل محددة (اسم شركة + مدة + نتيجة) = 6. كلام عام من غير تفاصيل = 2. مفيش خبرة بس الإجابة صادقة وواضحة = 3.',
      },
    ],
  },

  // ===================== 4) اختبارات الشغل الفعلي =====================
  {
    id: 'worksample',
    title: 'اختبارات الشغل الفعلي — دي أهم مرحلة',
    intro: 'الأسئلة دي بتتقيّم بعناية وبيتراجع عليها بشري. خدي وقتك واكتبي بنفسك.',
    weight: 65,
    questions: [
      {
        id: 'w1',
        type: 'textarea',
        required: true,
        weight: 15,
        label: `عميل بعتلك الرسالة دي على الواتساب:
«مساء الخير، أنا محتاج CV بالإنجليزي يعدي على أنظمة ATS، وكمان كوفر ليتر، وياريت يكون جاهز قبل الخميس عشان في وظيفة هقدم عليها، وممكن تبعتوهولي على الإيميل مش على الواتس؟»
السؤال: العميل طلب كام طلب بالظبط؟ اكتبيهم مرقمين واحد واحد.`,
        rubric:
          'الإجابة الصح فيها 4 طلبات: (1) CV إنجليزي ATS (2) كوفر ليتر (3) التسليم قبل الخميس (4) الإرسال على الإيميل مش الواتس. 4 صح = 15 · 3 = 10 · 2 = 5 · أقل = 0. ده أهم سؤال في الفورم لأنه بيقيس اتباع التعليمات والدقة — وده أساس شغلنا كله.',
      },
      {
        id: 'w2',
        type: 'textarea',
        required: true,
        weight: 10,
        label: `اقري السطور دي من سيرة ذاتية بالإنجليزي:
"Senior Sales Executive — ABC Trading Co., Cairo
Jan 2021 – Present
Managed a portfolio of 40+ B2B accounts and exceeded quarterly targets by 18%."
جاوبي بالعربي: (1) الشخص ده وظيفته إيه؟ (2) شغال في الشركة دي من إمتى ولحد إمتى؟ (3) إيه أهم نتيجة حققها؟`,
        rubric:
          '3 إجابات صح = 10 · 2 = 6 · 1 = 3 · غلط أو ترجمة حرفية من غير فهم = 0. بيقيس فهم الإنجليزي عمليًا بدل ما نسألها تقيّم نفسها.',
      },
      {
        id: 'w3',
        type: 'textarea',
        required: true,
        weight: 15,
        label: `عميلة مترددة ومش متأكدة إنها تدفع عشان تعمل سيرة ذاتية. اكتبي بالظبط الرسالة اللي هتبعتيها لها على الشات عشان تقنعيها تكمّل. خليها طبيعية زي شات حقيقي مش كلام رسمي.

مهم: ابدئي إجابتك بكلمة (جاهزة) قبل نص الرسالة.`,
        rubric: `التقييم: طبيعية اللهجة، فهم اعتراض العميلة، تقديم قيمة ملموسة مش وعود عامة، وجود خطوة تالية واضحة.
⚠️ لو الإجابة مش مبدوءة بكلمة (جاهزة) = خصم 10 درجات من الإجمالي تلقائيًا — ده اختبار مخفي لاتباع التعليمات.`,
      },
      {
        id: 'w4',
        type: 'textarea',
        required: true,
        weight: 10,
        label:
          'عميلة قالتلك: «السعر غالي عليا» أو «هفكر وأرجعلك». اكتبي بالظبط هتردي إزاي.',
        rubric:
          'الرد الكويس: ما بيتنازلش عن السعر فورًا، بيعيد صياغة القيمة، بيسأل سؤال يفتح الحوار تاني. الرد الضعيف: (تمام يا فندم في انتظارك) أو تخفيض فوري.',
      },
      {
        id: 'w5',
        type: 'textarea',
        required: true,
        weight: 10,
        label:
          'عميلة دفعت واستلمت السيرة الذاتية بس مش عاجباها ورجعت زعلانة على الشات. هتتصرفي إزاي عشان ترضّيها وتحافظي عليها؟',
        rubric:
          'الكويس: هدوء + اعتذار متزن من غير مبالغة + سؤال عن المشكلة بالتحديد + وعد بخطوة محددة. الضعيف: دفاع عن الشغل أو اعتذار مبالغ فيه من غير حل.',
      },
      {
        id: 'w6',
        type: 'radio',
        required: true,
        weight: 5,
        label: 'لو وصلك 5 عملاء في نفس الوقت على الشات، تتصرفي إزاي؟',
        options: [
          {
            value: 'a',
            label: 'أرد على الأقرب للشراء الأول وأطمّن الباقي إني جاية عليهم',
            score: 5,
          },
          { value: 'b', label: 'أرد بالترتيب اللي وصلوا بيه واحد ورا التاني', score: 3 },
          { value: 'c', label: 'أنسخ نفس الرد وأبعته للكل', score: 0 },
          { value: 'd', label: 'بيحصلي ضغط وبتلخبط', score: 0 },
        ],
      },
    ],
  },

  // ===================== 5) الذكاء الاصطناعي =====================
  {
    id: 'ai',
    title: 'الذكاء الاصطناعي',
    weight: 10,
    questions: [
      {
        id: 'a1',
        type: 'radio',
        required: true,
        weight: 3,
        label: 'استخدمتي أدوات ذكاء اصطناعي في شغل حقيقي قبل كده؟',
        options: [
          { value: 'none', label: 'لأ، مستخدمتش قبل كده', score: 0 },
          { value: 'basic', label: 'استخدمت أداة واحدة بشكل بسيط', score: 1 },
          { value: 'regular', label: 'بستخدم ChatGPT/Claude/Gemini بانتظام', score: 3 },
          { value: 'advanced', label: 'بستخدم أكتر من أداة وعندي طريقة شغل ثابتة', score: 3 },
        ],
      },
      {
        id: 'a2',
        type: 'textarea',
        required: true,
        weight: 7,
        label:
          'اكتبي البرومبت (الأمر) الفعلي اللي ممكن تكتبيه لأداة ذكاء اصطناعي عشان تساعدك تصيغي رد مقنع لعميلة مترددة.',
        hint: 'اكتبي البرومبت نفسه بالظبط زي ما هتكتبيه للأداة',
        rubric:
          'الكويس: فيه سياق (مين العميل + إيه الخدمة) + مهمة واضحة + نبرة مطلوبة. الضعيف: (اكتبلي رد على عميل) وبس. مش مطلوب خبرة سابقة — مطلوب تفكير منظم.',
      },
    ],
  },

  // ===================== 6) الالتزام والجدية =====================
  {
    id: 'commitment',
    title: 'الالتزام والجدية',
    weight: 15,
    questions: [
      {
        id: 'c1',
        type: 'textarea',
        required: true,
        weight: 5,
        label:
          'في التدريب هيتصحّح لك شغلك كل يوم، وساعات هتعيدي نفس المهمة أكتر من مرة لحد ما تظبط. إيه شعورك لما حد يصحح لك شغلك يوميًا، وبتتصرفي إزاي؟',
        rubric:
          'الكويس: تقبّل الملاحظة كأداة تعلّم + مثال عملي. الضعيف: كلام دفاعي أو إجابة مثالية جدًا من غير مضمون.',
      },
      {
        id: 'c2',
        type: 'textarea',
        required: true,
        weight: 5,
        label:
          'احكيلنا عن آخر مرة اتأخرتي أو مقدرتيش تنفذي التزام كان عليكي: إيه اللي حصل بالظبط وإيه اللي عملتيه بعدها؟',
        rubric:
          'الكويس: اعتراف بالمسؤولية + تصرف تصحيحي. الضعيف: إلقاء اللوم على الظروف أو إنكار إن ده حصل خالص (مؤشر على عدم صدق).',
      },
      {
        id: 'c3',
        type: 'textarea',
        required: true,
        weight: 5,
        label:
          'احكيلنا عن موقف اتطلب منك فيه تتعلمي أداة أو تعليمات جديدة بسرعة وتلتزمي بيها — إيه اللي عملتيه؟',
        rubric: 'الكويس: خطوات محددة (اتفرجت / جربت / سألت / كررت). الضعيف: كلام عام.',
      },
      {
        id: 'c4',
        type: 'radio',
        required: true,
        weight: 0,
        label:
          'أهلك عارفين بمواعيد الشغل (حضوري صباحي من المقر + شيفت مسائي من البيت) وموافقين؟',
        options: [
          { value: 'yes', label: 'آه عارفين وموافقين' },
          { value: 'will_tell', label: 'لسه هتكلم معاهم', flag: true },
          { value: 'no', label: 'لأ', knockout: true },
        ],
        rubric:
          'مش بيدي درجات — بس أهم مؤشر على إن الموظفة هتكمل معانا فعلًا ومش هتسيب بعد أسبوعين.',
      },
      {
        id: 'c5',
        type: 'radio',
        required: true,
        weight: 0,
        label:
          'الوظيفة عقد سنة، وفيه شرط الإبلاغ قبل ترك الشغل بشهر على الأقل. التفاصيل الكاملة بتتشرح وبتتوقّع في مرحلة التعاقد. مبدئيًا مستعدة؟',
        options: [
          { value: 'yes', label: 'آه مستعدة ألتزم بالسنة والإبلاغ المسبق' },
          { value: 'review', label: 'موافقة مبدئيًا بس حابة أراجع تفاصيل العقد قبل التوقيع' },
          { value: 'unsure', label: 'مش متأكدة', flag: true },
        ],
      },
      {
        id: 'c6',
        type: 'select',
        required: true,
        weight: 0,
        label: 'أقرب معاد تقدري تبدأي فيه؟',
        options: [
          { value: 'فورًا', label: 'فورًا' },
          { value: 'خلال أسبوع', label: 'خلال أسبوع' },
          { value: 'خلال أسبوعين', label: 'خلال أسبوعين' },
          { value: 'أكتر من أسبوعين', label: 'أكتر من أسبوعين' },
        ],
      },
      {
        id: 'c7',
        type: 'textarea',
        required: true,
        weight: 0,
        label: 'ليه نختارك أنتِ بالذات للدور ده؟ (سطرين بحد أقصى)',
        rubric:
          'مش بيدي درجات — بيتقري في المقابلة كمؤشر على الوضوح والاختصار. اللي بتكتب 10 سطور رغم إننا قلنا سطرين = مؤشر إضافي على عدم اتباع التعليمات.',
      },
    ],
  },
];

/**
 * ترتيب التدفق الفعلي: **البيانات الشخصية قبل بوابة الفلترة**.
 *
 * الـJSON كان حاطط البوابة أول حاجة، وده معناه إن أي متقدمة بتتستبعد فيها
 * بتتسجّل من غير اسم ولا رقم — يعني حتى لو حبينا نرجعلها في وظيفة تانية
 * مش هنعرف. البوابة لسه بتفلتر قبل الأسئلة الطويلة (خبرة + شغل + التزام)،
 * فهي لسه بتوفر وقت المتقدمة، بس بنضمن إن كل حد دخل ليه اسم ورقم.
 *
 * الترتيب ده بيحكم كمان ترقيم الأسئلة وترتيب العرض في الأدمن.
 */
const FLOW_ORDER: V2SectionId[] = [
  'basics',
  'gate',
  'experience',
  'worksample',
  'ai',
  'commitment',
];

export const MODERATOR_V2_SECTIONS: V2Section[] = FLOW_ORDER.map(
  (id) => SECTIONS_IN_JSON_ORDER.find((section) => section.id === id)!
);

// ===================== خريطة خطوات الواجهة (5 خطوات) =====================
// الأقسام الستة بتتجمّع في 5 خطوات: worksample + ai + commitment في خطوة واحدة
// اسمها «أسئلة الوظيفة» — التقييم بيفضل بالقسم زي ما هو في الـJSON.
export interface V2UiStep {
  key: string;
  title: string;
  icon: string;
  sections: V2SectionId[];
}

export const MODERATOR_V2_UI_STEPS: V2UiStep[] = [
  { key: 'basics', title: 'المعلومات الشخصية', icon: '👤', sections: ['basics'] },
  { key: 'gate', title: 'بوابة الفلترة', icon: '🚦', sections: ['gate'] },
  { key: 'experience', title: 'الخبرة', icon: '📋', sections: ['experience'] },
  {
    key: 'questions',
    title: 'أسئلة الوظيفة',
    icon: '❓',
    sections: ['worksample', 'ai', 'commitment'],
  },
  { key: 'review', title: 'المراجعة والإرسال', icon: '✅', sections: [] },
];

// ===================== إعدادات التقييم =====================
export const MODERATOR_V2_MAX_SCORE = 100;

/** وزن كل قسم (من الـJSON) — مجموعهم 100. */
export const MODERATOR_V2_SECTION_WEIGHTS: Record<string, number> = {
  experience: 10,
  worksample: 65,
  ai: 10,
  commitment: 15,
};

export interface V2Penalty {
  rule: string;
  points: number;
  reason: string;
}

export const MODERATOR_V2_PENALTIES: V2Penalty[] = [
  {
    rule: 'إجابة w3 مش مبدوءة بكلمة (جاهزة)',
    points: -10,
    reason: 'اختبار اتباع التعليمات المخفي',
  },
];

export interface V2Threshold {
  min: number;
  label: string;
  action: string;
}

export const MODERATOR_V2_THRESHOLDS: V2Threshold[] = [
  { min: 75, label: 'A', action: 'اتصلي بيها فورًا — مرشحة قوية' },
  { min: 60, label: 'B', action: 'قائمة انتظار — اتصلي لو الـA مكفوش' },
  { min: 0, label: 'C', action: 'اعتذار مهذب تلقائي' },
];

/**
 * الاستبعاد التلقائي **متوقّف**.
 *
 * الـJSON كان بيقول إن أي اختيار عليه knockout يوقف الفورم فورًا، بس ده كان
 * بيخلينا نخسر متقدمات ممكن نحتاجهم فعلًا (مثلًا واحدة شاطرة جدًا بس محتاجة
 * تدبّر لابتوب). دلوقتي كل واحدة بتكمّل الفورم للآخر وبتاخد درجتها كاملة،
 * والاختيارات اللي كانت بتستبعد بتتسجّل كـ«تحفّظات» (flags بـseverity: high)
 * وبتبان للأدمن بوضوح قبل ما يكلّمها.
 *
 * لو رجعت true تاني: الفورم بيقف عند أول اختيار knockout، بيعرض رسالة
 * الاعتذار، وبيسجّل الطلب بحالة REJECTED_AUTO — من غير أي تغيير تاني.
 */
export const MODERATOR_V2_AUTO_REJECT_ON_KNOCKOUT = false;

/** رسالة الاعتذار الموحّدة — بتتعرض بس لو الاستبعاد التلقائي مفعّل. */
export const MODERATOR_V2_REJECTION_MESSAGE =
  'شكرًا لاهتمامك بالانضمام لفريق CVeeez. للأسف الشروط الحالية مش متطابقة مع اللي وصفتيه، ونتمنالك التوفيق.';

// ===================== مساعدات =====================
export const MODERATOR_V2_QUESTIONS: V2Question[] = MODERATOR_V2_SECTIONS.flatMap(
  (s) => s.questions
);

const QUESTION_INDEX = new Map<string, { question: V2Question; section: V2Section }>();
for (const section of MODERATOR_V2_SECTIONS) {
  for (const question of section.questions) {
    QUESTION_INDEX.set(question.id, { question, section });
  }
}

export function getV2Question(id: string): V2Question | undefined {
  return QUESTION_INDEX.get(id)?.question;
}

export function getV2Section(questionId: string): V2Section | undefined {
  return QUESTION_INDEX.get(questionId)?.section;
}

export function getV2Sections(ids: V2SectionId[]): V2Section[] {
  return ids
    .map((id) => MODERATOR_V2_SECTIONS.find((s) => s.id === id))
    .filter((s): s is V2Section => !!s);
}

/** الخيار المختار لسؤال اختياري (بيطابق بالـvalue). */
export function getV2Option(question: V2Question, value: string): V2Option | undefined {
  return question.options?.find((o) => o.value === value);
}

/** نص الخيار للعرض — بيرجّع الـvalue نفسه لو مش لاقي (أمان للطلبات القديمة). */
export function v2OptionLabel(questionId: string, value: string): string {
  const q = getV2Question(questionId);
  if (!q?.options) return value;
  return q.options.find((o) => o.value === value)?.label ?? value;
}

/** الأسئلة المفتوحة اللي بتتقيّم بالـAI (وزن > 0 + عندها rubric). */
export function v2AiScoredQuestions(): V2Question[] {
  return MODERATOR_V2_QUESTIONS.filter(
    (q) => (q.weight ?? 0) > 0 && !!q.rubric && !q.options
  );
}
