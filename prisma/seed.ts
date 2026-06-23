import { PrismaClient, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const JOBS_DATA = [
  { title: 'مودريتور', titleEn: 'Moderator', slug: 'moderator', icon: '🛡️', description: 'إدارة المحتوى والمجتمعات الرقمية', sortOrder: 1 },
  { title: 'مصممي سيرة ذاتية', titleEn: 'CV Designer', slug: 'cv-designer', icon: '📄', description: 'تصميم سير ذاتية احترافية', sortOrder: 2 },
  { title: 'مصمم عام', titleEn: 'Graphic Designer', slug: 'graphic-designer', icon: '🎨', description: 'تصميم جرافيك وبصريات إبداعية', sortOrder: 3 },
  { title: 'خياطين', titleEn: 'Tailor', slug: 'tailor', icon: '🧵', description: 'أعمال الخياطة والتفصيل', sortOrder: 4 },
  { title: 'مقص دار', titleEn: 'Fabric Cutter', slug: 'fabric-cutter', icon: '✂️', description: 'قص الأقمشة والباترونات', sortOrder: 5 },
  { title: 'مسوقين بالعمولة', titleEn: 'Affiliate Marketer', slug: 'affiliate-marketer', icon: '📢', description: 'تسويق بالعمولة وجلب عملاء', sortOrder: 6 },
  { title: 'مبرمجين', titleEn: 'Developer', slug: 'developer', icon: '💻', description: 'تطوير مواقع وتطبيقات', sortOrder: 7 },
  { title: 'كاتب محتوى', titleEn: 'Content Writer', slug: 'content-writer', icon: '✍️', description: 'كتابة محتوى إبداعي وتسويقي', sortOrder: 8 },
  { title: 'UGC', titleEn: 'UGC Creator', slug: 'ugc-creator', icon: '📱', description: 'صناعة محتوى المستخدمين', sortOrder: 9 },
  { title: 'متدربين برمجة', titleEn: 'Programming Intern', slug: 'programming-intern', icon: '🎓', description: 'تدريب وتعلم البرمجة', sortOrder: 10 },
  { title: 'عاملة نظافة', titleEn: 'Cleaning Worker', slug: 'cleaning-worker', icon: '🧹', description: 'خدمات النظافة والترتيب', sortOrder: 11 },
];

// ===================== الأسئلة العامة =====================
const GLOBAL_QUESTIONS = [
  { text: 'الاسم الكامل', type: QuestionType.TEXT, isRequired: true, placeholder: 'اكتب اسمك الكامل', sortOrder: 1 },
  { text: 'البريد الإلكتروني', type: QuestionType.EMAIL, isRequired: true, placeholder: 'example@email.com', sortOrder: 2 },
  { text: 'رقم الهاتف (واتساب)', type: QuestionType.PHONE, isRequired: false, placeholder: '01xxxxxxxxx', sortOrder: 3 },
  { text: 'المدينة / المنطقة', type: QuestionType.SELECT, isRequired: false, options: ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'أسيوط', 'أخرى'], sortOrder: 4 },
  { text: 'كيف عرفت عنا؟', type: QuestionType.SELECT, isRequired: false, options: ['فيسبوك', 'إنستجرام', 'تيك توك', 'صديق/معرفة', 'موقع CVEEEZ', 'أخرى'], sortOrder: 5 },
  { text: 'صورة شخصية', type: QuestionType.IMAGE, isRequired: false, sortOrder: 6 },
];

// ===================== أسئلة كل وظيفة =====================
type QuestionData = {
  text: string;
  type: QuestionType;
  isRequired: boolean;
  placeholder?: string;
  options?: string[];
  sortOrder: number;
};

const JOB_SPECIFIC_QUESTIONS: Record<string, QuestionData[]> = {
  moderator: [
    { text: 'كم سنة خبرة فعلية عندك في إدارة المحتوى أو المجتمعات الإلكترونية؟', type: QuestionType.SELECT, isRequired: true, options: ['بدون خبرة', 'أقل من سنة', '1-2 سنة', '2-4 سنوات', 'أكتر من 4 سنوات'], sortOrder: 1 },
    { text: 'ما المنصات اللي عندك خبرة فعلية في إدارتها؟ (اختر اللي اشتغلت عليها فعلاً)', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['فيسبوك جروبات', 'فيسبوك صفحات', 'إنستجرام', 'تيك توك', 'تويتر/X', 'ديسكورد', 'تيليجرام', 'واتساب', 'يوتيوب'], sortOrder: 2 },
    { text: 'أكبر جروب/كوميونيتي اشتغلت معاه كان عنده كام عضو؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من 500', '500 - 5,000', '5,000 - 50,000', '50,000 - 500,000', 'أكتر من 500K'], sortOrder: 3 },
    { text: 'لو شركة/براند تواصل معاك يطلب إدارة كاملة لمجتمعه (رد على الناس + حذف مخالفات + متابعة 24/7)، أنت متوقع كام شهرياً بالجنيه المصري؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من 2,000', '2,000 - 4,000', '4,000 - 7,000', '7,000 - 12,000', '12,000 - 20,000', 'أكتر من 20,000'], sortOrder: 4 },
    { text: 'تفضل نظام دفع إيه؟', type: QuestionType.RADIO, isRequired: true, options: ['مرتب ثابت شهري', 'بالساعة', 'بالقطعة (لكل بوست/رد)', 'مرن - حسب الاتفاق'], sortOrder: 5 },
    { text: 'كم ساعة تقدر تخصص يومياً للشغل؟', type: QuestionType.SELECT, isRequired: true, options: ['2-4 ساعات', '4-6 ساعات', '6-8 ساعات', 'دوام كامل (8+ ساعات)'], sortOrder: 6 },
    { text: 'متوسط زمن ردك على رسالة/تعليق في الجروب لازم يكون قد إيه؟', type: QuestionType.SELECT, isRequired: true, options: ['تحت 5 دقايق', '15-30 دقيقة', 'في خلال ساعة', 'في خلال يوم'], sortOrder: 7 },
    { text: 'متاح للشغل في الأوقات دي؟ (اختر كل اللي ينطبق)', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['صباحاً (8ص-2م)', 'ظهراً (2م-6م)', 'مساءً (6م-12م)', 'بالليل (12م-6ص)', 'الويك إند', 'العطلات الرسمية'], sortOrder: 8 },
    { text: 'متى تقدر تبدأ الشغل فعلياً؟', type: QuestionType.SELECT, isRequired: true, options: ['فوراً', 'خلال 3 أيام', 'خلال أسبوع', 'خلال أسبوعين', 'أكتر من شهر'], sortOrder: 9 },
    { text: 'سيناريو: عضو في الجروب نشر إعلان لمنتج منافس وبدأ يجيب تفاعل، إيه أول 3 خطوات هتعملها بالترتيب؟', type: QuestionType.TEXTAREA, isRequired: true, placeholder: '1- ... 2- ... 3- ...', sortOrder: 10 },
    { text: 'سيناريو: لقيت اتنين أعضاء بيتشاجروا بعنف في التعليقات وبدأ الموضوع يتحول لإهانات شخصية، هتتدخل إزاي؟', type: QuestionType.TEXTAREA, isRequired: true, placeholder: 'اشرح ردك خطوة بخطوة...', sortOrder: 11 },
    { text: 'إيه أدوات الإدارة/الأتمتة اللي بتستخدمها؟ (اختر كل اللي تعرف تشتغل عليه)', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['Meta Business Suite', 'Facebook Automod', 'Discord Bots (MEE6, Dyno)', 'Telegram Bots', 'Hootsuite/Buffer', 'ManyChat', 'Zapier/Make', 'مفيش - يدوي'], sortOrder: 12 },
    { text: 'أنت قد إيه ماشي مع قوانين المحتوى الخاصة بالمنصات (Community Standards)؟', type: QuestionType.SELECT, isRequired: true, options: ['متمكن جداً وقريت السياسات', 'فاهم الأساسيات', 'بعرف اللي بيتقال عام', 'مش متابع'], sortOrder: 13 },
    { text: 'هل تقدر تعمل تقرير أسبوعي بالتفاعل والمشاكل والإحصائيات؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم - عملت تقارير قبل كده', 'نعم بس بساطة', 'لا'], sortOrder: 14 },
    { text: 'مستواك في اللغات؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['عربي مصري', 'عربي فصحى', 'إنجليزي تواصل', 'إنجليزي متقدم'], sortOrder: 15 },
    { text: 'لو طلبنا منك تكتب رد رسمي ودبلوماسي على شكوى عميل غاضب، اكتبه دلوقتي (3-5 أسطر):', type: QuestionType.TEXTAREA, isRequired: true, placeholder: 'اكتب الرد فعلياً...', sortOrder: 16 },
    { text: 'رابط لجروب/صفحة/كوميونيتي بتديره حالياً أو إدارته قبل كده (لو متاح)', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 17 },
    { text: 'ليه يخصك أنت بالذات نختارك للدور ده؟ (سطرين بحد أقصى)', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اقنعنا...', sortOrder: 18 },
  ],
  'cv-designer': [
    { text: 'ما البرامج اللي بتستخدمها في تصميم الـ CV؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['Canva', 'Photoshop', 'Illustrator', 'Figma', 'InDesign', 'Word/PowerPoint'], sortOrder: 1 },
    { text: 'أرفق 2-3 نماذج من CVs صممتها', type: QuestionType.FILE, isRequired: true, sortOrder: 2 },
    { text: 'هل عندك معرفة بأنظمة الـ ATS (Applicant Tracking Systems)؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم', 'لا', 'سمعت عنها بس'], sortOrder: 3 },
    { text: 'رابط أعمالك السابقة (Portfolio/Behance)', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 4 },
    { text: 'كم CV تقدر تصمم في اليوم الواحد؟', type: QuestionType.SELECT, isRequired: false, options: ['1-3', '4-6', '7-10', 'أكتر من 10'], sortOrder: 5 },
    { text: 'هل تقدر تصمم CVs بالعربي والإنجليزي؟', type: QuestionType.RADIO, isRequired: false, options: ['عربي فقط', 'إنجليزي فقط', 'الاتنين'], sortOrder: 6 },
  ],
  'graphic-designer': [
    { text: 'ما تخصصك الأساسي في التصميم؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['سوشيال ميديا', 'لوجوهات', 'بانرات', 'موشن جرافيك', 'UI/UX', 'تصميم طباعة', 'تصميم 3D'], sortOrder: 1 },
    { text: 'رابط أعمالك (Portfolio/Behance/Dribbble)', type: QuestionType.URL, isRequired: true, placeholder: 'https://...', sortOrder: 2 },
    { text: 'أرفق 3 نماذج من أفضل أعمالك', type: QuestionType.FILE, isRequired: true, sortOrder: 3 },
    { text: 'إيه خطوات عمليتك الإبداعية من أول ما تستلم المطلوب لحد التسليم؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح خطواتك...', sortOrder: 4 },
    { text: 'إزاي بتتعامل لو العميل انتقد تصميمك بشكل حاد؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح أسلوبك...', sortOrder: 5 },
    { text: 'هل تقدر تشتغل بمواعيد ضيقة وتسلّم شغل كتير في وقت قصير؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'أحياناً', 'بصعوبة'], sortOrder: 6 },
    { text: 'ما البرامج والأدوات اللي بتستخدمها؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['Photoshop', 'Illustrator', 'Figma', 'After Effects', 'Premiere', 'Canva', 'Blender'], sortOrder: 7 },
  ],
  tailor: [
    { text: 'كم سنة خبرة في الخياطة؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من سنة', '1-3 سنوات', '3-5 سنوات', 'أكتر من 5 سنوات'], sortOrder: 1 },
    { text: 'ما نوع الخياطة اللي بتشتغلها؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['ملابس رجالي', 'ملابس نسائي', 'ملابس أطفال', 'تعديلات/تضييق وتوسيع', 'تفصيل من الصفر', 'مفروشات'], sortOrder: 2 },
    { text: 'هل عندك ماكينة خياطة خاصة بيك؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم - صناعي', 'نعم - منزلي', 'لا'], sortOrder: 3 },
    { text: 'ما أنواع الأقمشة اللي بتشتغل عليها بكفاءة؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['قطن', 'حرير', 'جينز', 'شيفون', 'تل/دانتيل', 'جلد صناعي', 'صوف'], sortOrder: 4 },
    { text: 'أرفق صور من أعمالك السابقة', type: QuestionType.IMAGE, isRequired: false, sortOrder: 5 },
    { text: 'هل تقدر تاخد مقاسات بنفسك؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا'], sortOrder: 6 },
  ],
  'fabric-cutter': [
    { text: 'كم سنة خبرة في القص والباترونات؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من سنة', '1-3 سنوات', '3-5 سنوات', 'أكتر من 5 سنوات'], sortOrder: 1 },
    { text: 'هل تجيد قراءة وتنفيذ الباترونات؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم', 'أتعلم', 'لا'], sortOrder: 2 },
    { text: 'هل تقدر ترسم باترونات من الصفر؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم', 'لا'], sortOrder: 3 },
    { text: 'ما أنواع الأقمشة اللي بتشتغل عليها؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['أقمشة خفيفة', 'أقمشة متوسطة', 'أقمشة ثقيلة', 'أقمشة مطاطة', 'جلود'], sortOrder: 4 },
    { text: 'ما الأدوات اللي بتستخدمها في القص؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['مقص يدوي', 'مقص كهربائي', 'كتر دوار', 'طاولة قص'], sortOrder: 5 },
    { text: 'أرفق صور من أعمالك أو باترونات نفذتها', type: QuestionType.IMAGE, isRequired: false, sortOrder: 6 },
  ],
  'affiliate-marketer': [
    { text: 'هل عندك خبرة سابقة في التسويق بالعمولة أو التسويق الرقمي؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم', 'لا', 'تجربة بسيطة'], sortOrder: 1 },
    { text: 'ما المنصات اللي بتسوق عليها أو عندك جمهور فيها؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['فيسبوك', 'إنستجرام', 'تيك توك', 'تويتر/X', 'سناب شات', 'يوتيوب', 'واتساب', 'تيليجرام'], sortOrder: 2 },
    { text: 'كم عدد المتابعين عندك تقريباً (في أكبر منصة)؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من 1000', '1K-5K', '5K-10K', '10K-50K', '50K-100K', 'أكتر من 100K'], sortOrder: 3 },
    { text: 'رابط حسابك الأساسي (اللي عندك فيه أكبر جمهور)', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 4 },
    { text: 'إيه أكتر نوع محتوى بتعمله يجيب تفاعل؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح استراتيجيتك...', sortOrder: 5 },
    { text: 'هل سبق لك تحقيق مبيعات أو عمولات من التسويق؟ لو نعم، قد إيه تقريباً؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اكتب تفاصيل...', sortOrder: 6 },
    { text: 'هل عندك خبرة في الإعلانات المدفوعة (Facebook Ads, Google Ads)؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا'], sortOrder: 7 },
  ],
  developer: [
    { text: 'ما لغات البرمجة اللي بتشتغل بيها؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['JavaScript', 'TypeScript', 'Python', 'PHP', 'Java', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'C/C++'], sortOrder: 1 },
    { text: 'كم سنة خبرة في البرمجة؟', type: QuestionType.SELECT, isRequired: true, options: ['أقل من سنة', '1-2 سنوات', '3-5 سنوات', 'أكتر من 5 سنوات'], sortOrder: 2 },
    { text: 'ما تخصصك الأساسي؟', type: QuestionType.SELECT, isRequired: true, options: ['Frontend', 'Backend', 'Full-Stack', 'Mobile', 'DevOps', 'Data/AI', 'Game Dev'], sortOrder: 3 },
    { text: 'رابط GitHub أو GitLab الخاص بك', type: QuestionType.URL, isRequired: false, placeholder: 'https://github.com/...', sortOrder: 4 },
    { text: 'ما الـ Frameworks/Technologies اللي بتشتغل بيها؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Django', 'Laravel', 'Flutter', 'React Native', 'Docker'], sortOrder: 5 },
    { text: 'رابط Portfolio أو LinkedIn', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 6 },
    { text: 'لما بتقابلك مشكلة في الكود مش عارف تحلها، بتعمل إيه؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح أسلوبك...', sortOrder: 7 },
    { text: 'إزاي بتفضل تواكب التقنيات الجديدة وتتعلمها؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح طريقتك...', sortOrder: 8 },
  ],
  'content-writer': [
    { text: 'ما نوع المحتوى اللي بتكتبه؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['مقالات/بلوج', 'بوستات سوشيال ميديا', 'إعلانات/كوبي رايتنج', 'سكريبتات فيديو', 'ترجمة', 'محتوى SEO'], sortOrder: 1 },
    { text: 'أرفق نماذج من كتاباتك (2-3 نماذج)', type: QuestionType.FILE, isRequired: true, sortOrder: 2 },
    { text: 'هل عندك خبرة في الـ SEO (تحسين محركات البحث)؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم - خبرة قوية', 'نعم - أساسيات', 'لا'], sortOrder: 3 },
    { text: 'إزاي بتحدد الجمهور المستهدف قبل ما تكتب المحتوى؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اشرح استراتيجيتك...', sortOrder: 4 },
    { text: 'كم بوست/مقال تقدر تكتب أسبوعياً؟', type: QuestionType.SELECT, isRequired: false, options: ['1-3', '4-7', '8-15', 'أكتر من 15'], sortOrder: 5 },
    { text: 'هل تقدر تكتب محتوى بالعربي المصري (Casual Tone)؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا', 'بتعلم'], sortOrder: 6 },
    { text: 'رابط أي محتوى منشور ليك أونلاين (مقال، بلوج، الخ)', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 7 },
  ],
  'ugc-creator': [
    { text: 'رابط حسابك الأساسي (TikTok/Instagram/YouTube)', type: QuestionType.URL, isRequired: true, placeholder: 'https://...', sortOrder: 1 },
    { text: 'ما نوع المحتوى اللي بتعمله؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['ريفيوهات منتجات', 'Unboxing', 'Tutorials/شروحات', 'Lifestyle/يومي', 'كوميدي/ترفيه', 'تعليمي/نصائح'], sortOrder: 2 },
    { text: 'كم عدد متابعيك في أكبر منصة؟', type: QuestionType.SELECT, isRequired: false, options: ['أقل من 1K', '1K-5K', '5K-20K', '20K-100K', 'أكتر من 100K'], sortOrder: 3 },
    { text: 'أرفق رابط لأفضل فيديو عملته', type: QuestionType.URL, isRequired: false, placeholder: 'https://...', sortOrder: 4 },
    { text: 'هل عندك معدات تصوير (كاميرا، إضاءة، مايك)؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['موبايل فقط', 'كاميرا', 'إضاءة', 'مايكروفون', 'ترايبود/حامل'], sortOrder: 5 },
    { text: 'هل سبق لك التعاون مع براندات أو شركات؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا'], sortOrder: 6 },
    { text: 'إيه البراندات/المجالات اللي حابب تعمل لها محتوى؟', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اكتب هنا...', sortOrder: 7 },
  ],
  'programming-intern': [
    { text: 'ما مستواك الحالي في البرمجة؟', type: QuestionType.SELECT, isRequired: true, options: ['مبتدئ تماماً/لسه بادئ', 'بعرف الأساسيات', 'عملت مشاريع صغيرة', 'متوسط'], sortOrder: 1 },
    { text: 'ما المجال اللي عايز تتعلمه أو تتدرب فيه؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['تطوير مواقع (Web)', 'تطوير تطبيقات موبايل', 'Python/Data', 'JavaScript/React', 'تصميم واجهات UI/UX', 'قواعد بيانات'], sortOrder: 2 },
    { text: 'كم ساعة تقدر تخصص للتدريب أسبوعياً؟', type: QuestionType.SELECT, isRequired: true, options: ['5-10 ساعات', '10-20 ساعة', '20-30 ساعة', 'أكتر من 30 ساعة'], sortOrder: 3 },
    { text: 'هل عندك لابتوب أو كمبيوتر تقدر تتدرب عليه؟', type: QuestionType.RADIO, isRequired: true, options: ['نعم', 'لا', 'هجهز قريب'], sortOrder: 4 },
    { text: 'هل سبق ليك دراسة أي كورسات أونلاين في البرمجة؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا'], sortOrder: 5 },
    { text: 'ليه عايز تتعلم البرمجة؟ (باختصار)', type: QuestionType.TEXTAREA, isRequired: false, placeholder: 'اكتب هنا...', sortOrder: 6 },
    { text: 'هل عندك إنترنت مستقر للتعلم أونلاين؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'لا'], sortOrder: 7 },
  ],
  'cleaning-worker': [
    { text: 'المنطقة/المدينة المتاحة للعمل فيها', type: QuestionType.TEXT, isRequired: true, placeholder: 'مثال: مدينة نصر، المعادي...', sortOrder: 1 },
    { text: 'كم سنة خبرة في أعمال النظافة؟', type: QuestionType.SELECT, isRequired: true, options: ['بدون خبرة', 'أقل من سنة', '1-3 سنوات', 'أكتر من 3 سنوات'], sortOrder: 2 },
    { text: 'ما الأيام المتاحة للعمل فيها؟', type: QuestionType.MULTI_SELECT, isRequired: true, options: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'], sortOrder: 3 },
    { text: 'هل تفضل دوام كامل أم جزئي؟', type: QuestionType.SELECT, isRequired: false, options: ['دوام كامل - 8 ساعات', 'دوام جزئي - 4 ساعات', 'مرن/حسب الطلب'], sortOrder: 4 },
    { text: 'هل عندك خبرة في التنظيف المتخصص؟', type: QuestionType.MULTI_SELECT, isRequired: false, options: ['تنظيف منازل', 'تنظيف مكاتب/شركات', 'تنظيف سجاد وموكيت', 'تنظيف واجهات'], sortOrder: 5 },
    { text: 'هل تقدر تبدأ العمل خلال أسبوع؟', type: QuestionType.RADIO, isRequired: false, options: ['نعم', 'أحتاج وقت أكتر'], sortOrder: 6 },
  ],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@cveeez.online' },
    update: {},
    create: {
      email: 'admin@cveeez.online',
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin user created (admin@cveeez.online / admin123)');

  // Delete old wrong jobs that don't match the plan
  const oldSlugs = ['accountant', 'hr', 'customer-service'];
  for (const slug of oldSlugs) {
    await prisma.job.deleteMany({ where: { slug } }).catch(() => {});
  }

  // Create/Update jobs
  for (const jobData of JOBS_DATA) {
    await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {
        title: jobData.title,
        titleEn: jobData.titleEn,
        icon: jobData.icon,
        description: jobData.description,
        sortOrder: jobData.sortOrder,
      },
      create: {
        title: jobData.title,
        titleEn: jobData.titleEn,
        slug: jobData.slug,
        icon: jobData.icon,
        description: jobData.description,
        isActive: true,
        sortOrder: jobData.sortOrder,
      },
    });
  }
  console.log(`✅ ${JOBS_DATA.length} jobs created/updated`);

  // Seed global questions
  for (const qData of GLOBAL_QUESTIONS) {
    const existing = await prisma.question.findFirst({
      where: { text: qData.text, isGlobal: true },
    });

    if (!existing) {
      const question = await prisma.question.create({
        data: {
          text: qData.text,
          type: qData.type,
          isRequired: qData.isRequired,
          placeholder: qData.placeholder || null,
          options: qData.options || [],
          isGlobal: true,
          sortOrder: qData.sortOrder,
        },
      });

      // Link global question to ALL jobs
      const allJobs = await prisma.job.findMany({ select: { id: true } });
      for (const job of allJobs) {
        await prisma.jobQuestion.upsert({
          where: { jobId_questionId: { jobId: job.id, questionId: question.id } },
          update: {},
          create: { jobId: job.id, questionId: question.id, sortOrder: qData.sortOrder },
        });
      }
    }
  }
  console.log(`✅ ${GLOBAL_QUESTIONS.length} global questions seeded`);

  // Seed job-specific questions
  let totalJobQuestions = 0;
  for (const [jobSlug, questions] of Object.entries(JOB_SPECIFIC_QUESTIONS)) {
    const job = await prisma.job.findUnique({ where: { slug: jobSlug } });
    if (!job) {
      console.warn(`⚠️ Job not found for slug: ${jobSlug}`);
      continue;
    }

    for (const qData of questions) {
      const existing = await prisma.question.findFirst({
        where: { text: qData.text, isGlobal: false },
      });

      let questionId: string;

      if (existing) {
        questionId = existing.id;
      } else {
        const question = await prisma.question.create({
          data: {
            text: qData.text,
            type: qData.type,
            isRequired: qData.isRequired,
            placeholder: qData.placeholder || null,
            options: qData.options || [],
            isGlobal: false,
            sortOrder: qData.sortOrder + 100, // offset from global
          },
        });
        questionId = question.id;
        totalJobQuestions++;
      }

      // Link question to job
      await prisma.jobQuestion.upsert({
        where: { jobId_questionId: { jobId: job.id, questionId } },
        update: { sortOrder: qData.sortOrder + 100 },
        create: { jobId: job.id, questionId, sortOrder: qData.sortOrder + 100 },
      });
    }
  }
  console.log(`✅ ${totalJobQuestions} job-specific questions seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
