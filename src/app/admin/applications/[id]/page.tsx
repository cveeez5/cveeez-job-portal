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
} from 'lucide-react';
import { JOB_QUESTIONS } from '@/lib/constants';

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

          {/* Answers from answersJson */}
          {application.answersJson && Object.keys(application.answersJson).length > 0 && (
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
                  return (
                    <div key={questionId} className="border-b border-white/5 last:border-0 pb-3">
                      <p className="text-xs text-white/40 mb-1">
                        <span className="text-green-400/60">{index + 1}. </span>
                        {questionText}
                      </p>
                      <p className="text-sm text-white/90">{answer}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
