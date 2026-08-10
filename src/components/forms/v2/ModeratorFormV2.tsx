'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import StepIndicator from '@/components/forms/StepIndicator';
import QuestionFieldV2 from './QuestionFieldV2';
import KnockoutScreen from './KnockoutScreen';
import RichLabel from './RichLabel';
import {
  MODERATOR_FORM_VERSION,
  MODERATOR_V2_UI_STEPS,
  getV2Sections,
  type V2Question,
  type V2Section,
} from '@/lib/moderator-v2';
import { detectModeratorV2Knockout, type V2AnswerMeta } from '@/lib/scoring-v2';
import { validateModeratorV2Field } from '@/lib/validations';
import {
  useFormAutosave,
  loadSavedFormData,
  clearSavedFormData,
} from '@/hooks/useFormAutosave';

const STORAGE_KEY = 'moderator_v2';

interface SavedState {
  answers: Record<string, string>;
  meta: Record<string, V2AnswerMeta>;
  step: number;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 160 : -160, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -160 : 160, opacity: 0 }),
};

export default function ModeratorFormV2() {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<Record<string, V2AnswerMeta>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [knockedOut, setKnockedOut] = useState(false);
  const [restored, setRestored] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [hydrated, setHydrated] = useState(false);
  const [finished, setFinished] = useState(false);

  // ===== استرجاع التقدم المحفوظ (لو الصفحة اتقفلت في النص) =====
  useEffect(() => {
    const saved = loadSavedFormData<SavedState>(STORAGE_KEY);
    if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      setMeta(saved.meta || {});
      setCurrentStep(Math.min(saved.step || 0, MODERATOR_V2_UI_STEPS.length - 1));
      setRestored(true);
    }
    setHydrated(true);
  }, []);

  const autosaveData = useMemo<SavedState>(
    () => ({ answers, meta, step: currentStep }),
    [answers, meta, currentStep]
  );
  // بنوقف الحفظ في 3 حالات:
  //   - قبل ما نخلص استرجاع، عشان الحالة الفاضية متمسحش المحفوظ
  //   - أثناء الإرسال وبعد ما يتم، عشان الحفظ المؤجل ميرجّعش البيانات بعد ما
  //     نمسحها (بيحصل لما الريكوست يخلص أسرع من مدة التأجيل)
  useFormAutosave(STORAGE_KEY, autosaveData, hydrated && !isSubmitting && !finished);

  const steps = MODERATOR_V2_UI_STEPS;
  const step = steps[currentStep];
  const sections = useMemo(() => getV2Sections(step.sections), [step.sections]);
  const isReviewStep = step.key === 'review';

  // ===== ترقيم الأسئلة على مستوى الفورم كله =====
  const questionNumbers = useMemo(() => {
    const map = new Map<string, number>();
    let n = 1;
    for (const uiStep of MODERATOR_V2_UI_STEPS) {
      for (const section of getV2Sections(uiStep.sections)) {
        for (const question of section.questions) map.set(question.id, n++);
      }
    }
    return map;
  }, []);

  const updateAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateMeta = useCallback((id: string, value: V2AnswerMeta) => {
    setMeta((prev) => ({ ...prev, [id]: value }));
  }, []);

  const validateStep = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const section of sections) {
      for (const question of section.questions) {
        const value = (answers[question.id] ?? '').trim();
        if (question.required && !value) {
          nextErrors[question.id] = 'السؤال ده مطلوب';
          continue;
        }
        if (!value) continue;
        const formatError = validateModeratorV2Field(question.id, value);
        if (formatError) nextErrors[question.id] = formatError;
      }
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstId = Object.keys(nextErrors)[0];
      document
        .getElementById(`label-${firstId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }, [answers, sections]);

  const submit = useCallback(
    async (isKnockout: boolean) => {
      setIsSubmitting(true);
      setSubmitError('');
      try {
        const body = new FormData();
        body.append('jobSlug', 'moderator');
        body.append('formVersion', String(MODERATOR_FORM_VERSION));
        body.append('answers', JSON.stringify(answers));
        body.append('answerMeta', JSON.stringify(meta));

        const res = await fetch('/api/applications', { method: 'POST', body });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setSubmitError(data?.error || 'حصل خطأ أثناء إرسال الطلب. حاولي تاني.');
          return;
        }

        // الترتيب مهم: بنقفل الحفظ الأول وبعدين نمسح، عشان مفيش حفظ مؤجل
        // يقدر يرجّع البيانات بعد المسح
        setFinished(true);
        clearSavedFormData(STORAGE_KEY);

        // السيرفر هو اللي بيحدد الاستبعاد فعلياً — بنمشي على رده
        if (data?.knockout || isKnockout) {
          setKnockedOut(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        router.push('/success?job=moderator');
      } catch {
        setSubmitError('حصل خطأ في الاتصال. اتأكدي من النت وحاولي تاني.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, meta, router]
  );

  const goNext = useCallback(async () => {
    if (!validateStep()) return;

    // الاستبعاد بيتفحص قبل أي انتقال — والسيرفر بيعيد فحصه من الإجابات الخام
    if (detectModeratorV2Knockout(answers)) {
      await submit(true);
      return;
    }

    setRestored(false);
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [answers, steps.length, submit, validateStep]);

  const goBack = useCallback(() => {
    setRestored(false);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const restart = useCallback(() => {
    clearSavedFormData(STORAGE_KEY);
    setFinished(false);
    setAnswers({});
    setMeta({});
    setErrors({});
    setCurrentStep(0);
    setRestored(false);
  }, []);

  if (knockedOut) {
    return (
      <div className="glass-card p-6 sm:p-8">
        <KnockoutScreen />
      </div>
    );
  }

  return (
    <>
      <StepIndicator
        steps={steps.map((s) => ({ title: s.title, icon: s.icon }))}
        currentStep={currentStep}
      />

      {restored && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
          <p className="text-xs text-green-300/90 leading-relaxed">
            رجّعنالك اللي كتبتيه قبل كده — كمّلي من مكانك.
          </p>
          <button
            type="button"
            onClick={restart}
            className="shrink-0 flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ابدأي من الأول
          </button>
        </div>
      )}

      <div className="glass-card p-5 sm:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {isReviewStep ? (
              <ReviewSummary answers={answers} />
            ) : (
              <div className="space-y-8">
                {sections.map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    answers={answers}
                    errors={errors}
                    meta={meta}
                    numbers={questionNumbers}
                    onChange={updateAnswer}
                    onMeta={updateMeta}
                  />
                ))}
              </div>
            )}

            {submitError && (
              <p role="alert" className="mt-6 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl">
                {submitError}
              </p>
            )}

            {/* التنقل */}
            <div className="flex items-center justify-between gap-3 pt-8">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="btn-secondary"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>
              ) : (
                <span />
              )}

              {isReviewStep ? (
                <button
                  type="button"
                  onClick={() => submit(false)}
                  disabled={isSubmitting}
                  className="btn-primary min-w-[160px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      إرسال الطلب
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={isSubmitting}
                  className="btn-primary justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      التالي
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ===================== قسم من الأسئلة =====================
function SectionBlock({
  section,
  answers,
  errors,
  meta,
  numbers,
  onChange,
  onMeta,
}: {
  section: V2Section;
  answers: Record<string, string>;
  errors: Record<string, string>;
  meta: Record<string, V2AnswerMeta>;
  numbers: Map<string, number>;
  onChange: (id: string, value: string) => void;
  onMeta: (id: string, meta: V2AnswerMeta) => void;
}) {
  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {section.title}
        </h2>
        {section.intro && (
          <p className="text-sm text-white/50 leading-relaxed">{section.intro}</p>
        )}
      </header>

      <div className="space-y-6">
        {section.questions.map((question) => (
          <QuestionFieldV2
            key={question.id}
            question={question}
            index={numbers.get(question.id) ?? 0}
            value={answers[question.id] ?? ''}
            error={errors[question.id]}
            meta={meta[question.id]}
            onChange={onChange}
            onMeta={isOpenQuestion(question) ? onMeta : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function isOpenQuestion(question: V2Question): boolean {
  return question.type === 'textarea';
}

// ===================== المراجعة =====================
function ReviewSummary({ answers }: { answers: Record<string, string> }) {
  const reviewSections = useMemo(
    () =>
      MODERATOR_V2_UI_STEPS.filter((s) => s.key !== 'review').flatMap((s) =>
        getV2Sections(s.sections)
      ),
    []
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">✅ مراجعة البيانات</h2>
        <p className="text-sm text-white/50">راجعي إجاباتك كويس قبل ما تبعتي الطلب</p>
      </div>

      {reviewSections.map((section) => (
        <div key={section.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
          <h3 className="text-sm font-semibold text-green-400 mb-3 leading-relaxed">
            {section.title}
          </h3>
          <div className="space-y-3">
            {section.questions.map((question) => {
              const raw = (answers[question.id] ?? '').trim();
              const display = question.options
                ? question.options.find((o) => o.value === raw)?.label ?? raw
                : raw;
              return (
                <div
                  key={question.id}
                  className="border-b border-white/5 last:border-0 pb-3 last:pb-0"
                >
                  <div className="text-xs text-white/40 mb-1 leading-relaxed">
                    <RichLabel text={question.label} />
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
                    {display || '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300/80 leading-relaxed">
        <p>
          ⚠️ بإرسال الطلب ده بتأكدي إن كل البيانات اللي كتبتيها صحيحة. لو في أي
          حاجة مش صح ترجعي وتعدليها.
        </p>
      </div>
    </div>
  );
}
