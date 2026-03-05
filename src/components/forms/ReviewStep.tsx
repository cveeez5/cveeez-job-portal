'use client';

import { Check, ChevronRight, Loader2, User, Briefcase, FileText, Link as LinkIcon } from 'lucide-react';
import type { Job, JobQuestion } from '@/types';

interface ReviewStepProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    city: string;
    yearsOfExperience: string;
    linkedinUrl: string;
    cvFile: File | null;
    answers: Record<string, string>;
  };
  job: Job;
  questions: JobQuestion[];
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const experienceLabels: Record<string, string> = {
  no_experience: 'بدون خبرة',
  less_than_1: 'أقل من سنة',
  '1_to_3': '١ - ٣ سنوات',
  '3_to_5': '٣ - ٥ سنوات',
  more_than_5: 'أكثر من ٥ سنوات',
};

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-green-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 min-w-[80px] sm:min-w-[100px] shrink-0">{label}</span>
      <span className="text-sm text-white/90">{value}</span>
    </div>
  );
}

export default function ReviewStep({
  formData,
  job,
  questions,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-2">✅ مراجعة البيانات</h2>
      <p className="text-sm text-white/50 mb-6">
        راجع بياناتك كويس قبل ما تبعت الطلب
      </p>

      {/* Job info */}
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <span className="text-2xl">{job.icon}</span>
        <div>
          <p className="text-sm text-white/50">الوظيفة المتقدم ليها</p>
          <p className="font-bold text-white">{job.title}</p>
        </div>
      </div>

      {/* Personal Info Section */}
      <ReviewSection title="المعلومات الشخصية" icon={User}>
        <ReviewRow label="الاسم" value={formData.name} />
        <ReviewRow label="الإيميل" value={formData.email} />
        <ReviewRow label="رقم الموبايل" value={formData.phone} />
        <ReviewRow label="المدينة" value={formData.city} />
      </ReviewSection>

      {/* Experience Section */}
      <ReviewSection title="الخبرة والسيرة الذاتية" icon={Briefcase}>
        <ReviewRow
          label="سنين الخبرة"
          value={experienceLabels[formData.yearsOfExperience] || formData.yearsOfExperience}
        />
        {formData.linkedinUrl && (
          <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-white/40 min-w-[100px] shrink-0">لينكدإن</span>
            <a
              href={formData.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 underline decoration-green-400/30"
            >
              <LinkIcon className="w-3 h-3" />
              الملف الشخصي
            </a>
          </div>
        )}
        {formData.cvFile && (
          <div className="flex items-start gap-2 py-1.5">
            <span className="text-xs text-white/40 min-w-[100px] shrink-0">السيرة الذاتية</span>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <FileText className="w-3.5 h-3.5 text-green-400" />
              <span>{formData.cvFile.name}</span>
              <span className="text-xs text-white/30">
                ({(formData.cvFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
          </div>
        )}
      </ReviewSection>

      {/* Questions Section */}
      {questions.length > 0 && (
        <ReviewSection title="إجابات أسئلة الوظيفة" icon={Briefcase}>
          {questions.map((q, index) => {
            const answer = formData.answers[q.id];
            return (
              <div key={q.id} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-xs text-white/40 mb-0.5">
                  <span className="text-green-400/60">{index + 1}.</span> {q.text}
                </p>
                <p className="text-sm text-white/90">{answer || '—'}</p>
              </div>
            );
          })}
        </ReviewSection>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300/80">
        <p>
          ⚠️ بإرسال الطلب ده أنت بتأكد إن كل البيانات اللي كتبتها صحيحة. لو في
          أي حاجة مش صح ممكن ترجع وتعدلها.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          <ChevronRight className="w-4 h-4" />
          تعديل البيانات
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="btn-primary min-w-[180px] justify-center"
          disabled={isSubmitting}
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
      </div>
    </div>
  );
}
