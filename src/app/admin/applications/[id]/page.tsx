'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  User,
  Briefcase,
  FileText,
  Download,
  Link as LinkIcon,
  MessageSquare,
  Save,
  Loader2,
  Ban,
  ClipboardCheck,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { JOB_QUESTIONS } from '@/lib/constants';
import { scoreApplication, scoreTier, hasScoring } from '@/lib/scoring';
import {
  MODERATOR_V2_SECTIONS,
  MODERATOR_V2_THRESHOLDS,
  v2OptionLabel,
} from '@/lib/moderator-v2';
import {
  copyRiskLevel,
  v2GradeStyle,
  V2_SECTION_TITLES,
  type V2AnswerMeta,
  type V2Flag,
  type V2QuestionScore,
  type V2ScoreBreakdown,
} from '@/lib/scoring-v2';
import type { V2Penalty } from '@/lib/moderator-v2';

interface ApplicationDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  answersJson: Record<string, string> | null;
  job: { title: string; slug: string; icon: string; titleEn: string | null };
  // ===== حقول التقييم v2 (فاضية في الطلبات القديمة) =====
  formVersion: number;
  totalScore: number | null;
  grade: string | null;
  knockoutReason: string | null;
  scoreBreakdown: V2ScoreBreakdown | null;
  penalties: V2Penalty[] | null;
  flags: V2Flag[] | null;
  answerMeta: Record<string, V2AnswerMeta> | null;
  answers: Array<{
    id: string;
    value: string;
    question: { text: string; type: string };
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

const statusOptions = [
  { value: 'PENDING', label: 'قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'REVIEWED', label: 'تمت المراجعة', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'SHORTLISTED', label: 'قائمة مختصرة', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'ACCEPTED', label: 'مقبول', color: 'bg-green-500/20 text-green-400' },
  { value: 'REJECTED', label: 'مرفوض', color: 'bg-red-500/20 text-red-400' },
  { value: 'REJECTED_AUTO', label: 'مستبعد تلقائياً', color: 'bg-red-500/10 text-red-300' },
];

const experienceLabels: Record<string, string> = {
  no_experience: 'بدون خبرة',
  less_than_1: 'أقل من سنة',
  '1_to_3': '١ - ٣ سنوات',
  '3_to_5': '٣ - ٥ سنوات',
  more_than_5: 'أكثر من ٥ سنوات',
};

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setApplication(data);
        setStatus(data.status);
        setNotes(data.notes || '');
      } else {
        router.push('/admin/applications');
      }
    } catch {
      router.push('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplication((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const res = await fetch(`/api/applications/${id}/rescore`, { method: 'POST' });
      if (res.ok) {
        await fetchApplication();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'فشلت إعادة التقييم');
      }
    } catch (error) {
      console.error('Error rescoring:', error);
      alert('حصل خطأ أثناء إعادة التقييم');
    } finally {
      setRescoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-white/30">الطلب مش موجود</p>
      </div>
    );
  }

  // formVersion 2 = فورم المودريتور الجديد. أي حاجة أقل = الطلبات القديمة
  // وبتتعرض بنفس منطق v1 بالظبط من غير ما تتأثر بحاجة.
  const isV2 = (application.formVersion ?? 1) >= 2;

  const showScore = !isV2 && hasScoring(application.job.slug);
  const score = showScore
    ? scoreApplication(application.job.slug, application.answersJson)
    : null;
  const breakdownById = Object.fromEntries(
    (score?.breakdown || []).map((b) => [b.id, b])
  );
  // الطلبات القديمة (مجاوبتش على أسئلة متقيَّمة) مفيش ليها كارت درجة
  const hasRealScore = !!score && score.answeredScored > 0;
  const tier = hasRealScore ? scoreTier(score!.percent) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/applications')}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{application.name}</h1>
          <p className="text-sm text-white/40">
            {application.job.icon} {application.job.title} •{' '}
            {new Date(application.createdAt).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-green-400" />
              <h2 className="font-semibold text-white">المعلومات الشخصية</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="الاسم" value={application.name} />
              <InfoField label="الإيميل" value={application.email} />
              <InfoField label="الموبايل" value={application.phone} />
              <InfoField label="المدينة" value={application.city} />
            </div>
          </div>

          {/* Experience */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-green-400" />
              <h2 className="font-semibold text-white">الخبرة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="سنين الخبرة"
                value={
                  experienceLabels[application.yearsOfExperience || ''] ||
                  application.yearsOfExperience
                }
              />
              {application.linkedinUrl && (
                <div>
                  <p className="text-xs text-white/40 mb-1">لينكدإن</p>
                  <a
                    href={application.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-400 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    الملف الشخصي
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Files */}
          {application.files.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-green-400" />
                <h2 className="font-semibold text-white">الملفات المرفقة</h2>
              </div>
              <div className="space-y-2">
                {application.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/40" />
                      <div>
                        <p className="text-sm text-white">{file.fileName}</p>
                        <p className="text-xs text-white/30">
                          {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 text-green-400"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* إجابات فورم v2 — مقسومة بالأقسام ومعاها درجة كل سؤال ومؤشر النسخ */}
          {isV2 && (
            <V2AnswersView
              answers={application.answersJson || {}}
              breakdown={application.scoreBreakdown}
              answerMeta={application.answerMeta}
            />
          )}

          {/* Answers from answersJson */}
          {!isV2 && application.answersJson && Object.keys(application.answersJson).length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <h2 className="font-semibold text-white">إجابات الأسئلة</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(application.answersJson).map(([questionId, answer], index) => {
                  const jobQuestions = JOB_QUESTIONS[application.job.slug] || [];
                  const question = jobQuestions.find((q) => q.id === questionId);
                  const questionText = question?.text || questionId;
                  const b = breakdownById[questionId];
                  return (
                    <div key={questionId} className="border-b border-white/5 last:border-0 pb-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-white/40 flex-1">
                          <span className="text-green-400/60">{index + 1}. </span>
                          {questionText}
                        </p>
                        {b && b.weight > 0 && (
                          <span
                            className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md ${
                              b.isRedFlag
                                ? 'bg-red-500/15 text-red-400'
                                : b.fraction >= 0.75
                                ? 'bg-green-500/15 text-green-400'
                                : b.fraction >= 0.4
                                ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-white/5 text-white/40'
                            }`}
                            title={`${b.earned.toFixed(1)} من ${b.weight} نقطة`}
                          >
                            {b.isRedFlag ? '⚠️ ' : ''}
                            {b.earned.toFixed(1)}/{b.weight}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">{answer}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* تقييم فورم v2 */}
          {isV2 && (
            <V2ScoreCard
              totalScore={application.totalScore}
              grade={application.grade}
              knockoutReason={application.knockoutReason}
              breakdown={application.scoreBreakdown}
              penalties={application.penalties}
              flags={application.flags}
              onRescore={handleRescore}
              rescoring={rescoring}
            />
          )}

          {/* Auto score */}
          {hasRealScore && score && tier && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4">التقييم الآلي</h3>
              <div className="flex items-center gap-4">
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl ${tier.color}`}>
                  <span className="text-2xl font-extrabold leading-none">{score.percent}</span>
                  <span className="text-[10px] opacity-70">من 100</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${tier.text}`}>{tier.label}</p>
                  <p className="text-xs text-white/40 mt-1">
                    جاوب على {score.answeredScored} من {score.totalScored} سؤال مؤثّر
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-green-400 to-emerald-500"
                      style={{ width: `${score.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {score.flags.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs text-red-400/80 font-medium">⚠️ نقاط تستدعي الانتباه:</p>
                  {score.flags.map((f, i) => (
                    <p key={i} className="text-xs text-red-300/70 bg-red-500/5 rounded-lg px-2 py-1">
                      {f}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-white/25 mt-4 leading-relaxed">
                الدرجة تقديرية تلقائية بتساعدك في الترتيب — مش بديل عن مراجعتك ومراجعة الانترفيو.
              </p>
            </div>
          )}

          {/* Status + Notes */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4">إجراءات</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">الحالة</label>
                <div className="space-y-2">
                  {statusOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                        status === opt.value
                          ? opt.color + ' border border-current/20'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={opt.value}
                        checked={status === opt.value}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-3 h-3 accent-green-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5">ملاحظات</label>
                <textarea
                  className="glass-input min-h-[100px] resize-y"
                  placeholder="اكتب ملاحظاتك هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-sm text-white">{value || '—'}</p>
    </div>
  );
}

// ===================== عرض إجابات فورم v2 =====================
const COPY_RISK_LABELS: Record<'low' | 'high', { text: string; className: string }> = {
  high: { text: 'مؤشر نسخ قوي', className: 'bg-red-500/15 text-red-400' },
  low: { text: 'مؤشر نسخ', className: 'bg-yellow-500/15 text-yellow-400' },
};

function V2AnswersView({
  answers,
  breakdown,
  answerMeta,
}: {
  answers: Record<string, string>;
  breakdown: V2ScoreBreakdown | null;
  answerMeta: Record<string, V2AnswerMeta> | null;
}) {
  const questionScores = breakdown?.questions || {};

  return (
    <>
      {MODERATOR_V2_SECTIONS.map((section) => {
        const answered = section.questions.filter((q) => (answers[q.id] ?? '').trim());
        if (answered.length === 0) return null;
        const sectionScore = breakdown?.sections?.[section.id];

        return (
          <div key={section.id} className="glass-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-green-400 shrink-0" />
                <h2 className="font-semibold text-white truncate">
                  {V2_SECTION_TITLES[section.id] || section.title}
                </h2>
              </div>
              {sectionScore && (
                <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-white/70">
                  {sectionScore.earned} / {sectionScore.max}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {answered.map((question) => {
                const raw = (answers[question.id] ?? '').trim();
                const display = question.options ? v2OptionLabel(question.id, raw) : raw;
                const qScore: V2QuestionScore | undefined = questionScores[question.id];
                const meta = answerMeta?.[question.id];
                const risk = copyRiskLevel(meta);

                return (
                  <div
                    key={question.id}
                    className="border-b border-white/5 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs text-white/40 flex-1 whitespace-pre-wrap leading-relaxed">
                        <span className="text-green-400/60">{question.id}. </span>
                        {question.label}
                      </p>
                      {qScore && qScore.max > 0 && (
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md ${
                            qScore.earned / qScore.max >= 0.75
                              ? 'bg-green-500/15 text-green-400'
                              : qScore.earned / qScore.max >= 0.4
                                ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-white/5 text-white/40'
                          }`}
                          title={qScore.reason || undefined}
                        >
                          {qScore.earned}/{qScore.max}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
                      {display}
                    </p>

                    {(meta || qScore?.reason) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {meta && (
                          <span className="text-[10px] text-white/30 bg-white/5 rounded-md px-1.5 py-0.5">
                            {meta.seconds} ث · {meta.chars} حرف
                            {meta.pasted ? ' · لصق' : ''}
                          </span>
                        )}
                        {risk !== 'none' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${COPY_RISK_LABELS[risk].className}`}
                          >
                            ⚠️ {COPY_RISK_LABELS[risk].text}
                          </span>
                        )}
                        {qScore?.reason && (
                          <span className="text-[10px] text-white/35 leading-relaxed">
                            {qScore.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ===================== كارت تقييم v2 =====================
function V2ScoreCard({
  totalScore,
  grade,
  knockoutReason,
  breakdown,
  penalties,
  flags,
  onRescore,
  rescoring,
}: {
  totalScore: number | null;
  grade: string | null;
  knockoutReason: string | null;
  breakdown: V2ScoreBreakdown | null;
  penalties: V2Penalty[] | null;
  flags: V2Flag[] | null;
  onRescore: () => void;
  rescoring: boolean;
}) {
  const flagList = flags || [];

  // ===== طلب مستبعد تلقائياً: مفيش درجة، بنعرض السبب بس =====
  if (knockoutReason) {
    return (
      <div className="glass-card p-5 border border-red-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Ban className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-white">مستبعدة تلقائياً</h3>
        </div>
        <p className="text-xs text-red-300/80 bg-red-500/5 rounded-lg px-2.5 py-2 leading-relaxed whitespace-pre-wrap">
          {knockoutReason}
        </p>
        <p className="text-[11px] text-white/25 mt-3 leading-relaxed">
          البوابة بتيجي قبل البيانات الشخصية، فممكن الاسم والتليفون يكونوا فاضيين.
        </p>
        {flagList.length > 0 && <FlagList flags={flagList} />}
      </div>
    );
  }

  const style = v2GradeStyle(grade);
  const threshold = MODERATOR_V2_THRESHOLDS.find((t) => t.label === grade);
  const sections = breakdown?.sections || {};
  const penaltyList = penalties || [];
  const rawTotal = breakdown?.rawTotal;
  const provisional = breakdown?.provider !== 'gemini' || breakdown?.needsRescore;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-white">التقييم الآلي</h3>
        <button
          onClick={onRescore}
          disabled={rescoring}
          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-green-400 transition-colors disabled:opacity-50"
          title="إعادة تقييم الأسئلة المفتوحة بالذكاء الاصطناعي"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rescoring ? 'animate-spin' : ''}`} />
          {rescoring ? 'جاري التقييم...' : 'إعادة تقييم'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl ${style.color}`}
        >
          <span className="text-2xl font-extrabold leading-none">{totalScore ?? '—'}</span>
          <span className="text-[10px] opacity-70">من 100</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-extrabold ${style.text}`}>التصنيف {style.label}</p>
          {threshold && (
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{threshold.action}</p>
          )}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-green-400 to-emerald-500"
              style={{ width: `${Math.max(0, Math.min(100, totalScore ?? 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* تفصيل الدرجات بالقسم */}
      {Object.keys(sections).length > 0 && (
        <div className="mt-5 space-y-2.5">
          <p className="text-xs text-white/40 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" />
            تفصيل الدرجات
          </p>
          {Object.entries(sections).map(([sectionId, s]) => (
            <div key={sectionId}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/60">{V2_SECTION_TITLES[sectionId] || sectionId}</span>
                <span className="text-white/70 font-medium">
                  {s.earned} / {s.max}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500/50"
                  style={{ width: `${s.max > 0 ? (s.earned / s.max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {typeof rawTotal === 'number' && penaltyList.length > 0 && (
            <p className="text-[11px] text-white/30 pt-1">
              المجموع قبل الخصم: {rawTotal}
            </p>
          )}
        </div>
      )}

      {/* الخصومات */}
      {penaltyList.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-orange-400/80 font-medium flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            خصومات
          </p>
          {penaltyList.map((p, i) => (
            <div
              key={i}
              className="text-[11px] text-orange-300/80 bg-orange-500/5 rounded-lg px-2 py-1.5 leading-relaxed"
            >
              <span className="font-bold">{p.points}</span> — {p.rule}
              <span className="block text-white/30 mt-0.5">{p.reason}</span>
            </div>
          ))}
        </div>
      )}

      {flagList.length > 0 && <FlagList flags={flagList} />}

      <p className="text-[11px] text-white/25 mt-4 leading-relaxed">
        {provisional
          ? '⚠️ درجات الأسئلة المفتوحة تقريبية دلوقتي — اضغطي «إعادة تقييم» بعد ما مفتاح الذكاء الاصطناعي يتظبط.'
          : `الأسئلة المفتوحة اتقيّمت بـ${breakdown?.model || 'الذكاء الاصطناعي'} — الدرجة مساعِدة مش بديل عن مراجعتك.`}
      </p>
    </div>
  );
}

function FlagList({ flags }: { flags: V2Flag[] }) {
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-xs text-yellow-400/80 font-medium flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        نقاط تستدعي الانتباه
      </p>
      {flags.map((f, i) => (
        <p
          key={i}
          className="text-[11px] text-yellow-300/70 bg-yellow-500/5 rounded-lg px-2 py-1.5 leading-relaxed"
        >
          {f.label}: «{f.note}»
        </p>
      ))}
    </div>
  );
}
