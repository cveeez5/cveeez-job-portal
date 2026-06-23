'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Save,
  Briefcase,
  Loader2,
  HelpCircle,
  Users,
} from 'lucide-react';

interface JobQuestion {
  id: string;
  sortOrder: number;
  question: {
    id: string;
    text: string;
    type: string;
    isRequired: boolean;
    isGlobal: boolean;
    options: string[];
  };
}

interface JobDetail {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  questions: JobQuestion[];
  _count: { applications: number };
}

const TYPE_LABELS: Record<string, string> = {
  TEXT: 'نص قصير',
  TEXTAREA: 'نص طويل',
  EMAIL: 'بريد إلكتروني',
  PHONE: 'رقم هاتف',
  NUMBER: 'رقم',
  SELECT: 'قائمة اختيار',
  MULTI_SELECT: 'اختيار متعدد',
  RADIO: 'اختيار واحد',
  CHECKBOX: 'صح/خطأ',
  FILE: 'رفع ملف',
  IMAGE: 'رفع صورة',
  URL: 'رابط',
  DATE: 'تاريخ',
  PORTFOLIO: 'رابط أعمال',
};

export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<JobDetail | null>(null);

  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      if (!res.ok) {
        router.push('/admin/jobs');
        return;
      }
      const data = await res.json();
      setJob(data);
      setTitle(data.title);
      setTitleEn(data.titleEn || '');
      setDescription(data.description || '');
      setIcon(data.icon || '');
      setIsActive(data.isActive);
      setSortOrder(data.sortOrder);
    } catch {
      router.push('/admin/jobs');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          titleEn: titleEn || null,
          description: description || null,
          icon: icon || '💼',
          isActive,
          sortOrder,
        }),
      });
      if (res.ok) {
        router.push('/admin/jobs');
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 mt-3 text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (!job) return null;

  const globalQuestions = job.questions.filter((jq) => jq.question.isGlobal);
  const specificQuestions = job.questions.filter((jq) => !jq.question.isGlobal);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/jobs')}
          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{job.icon}</span>
            تعديل: {job.title}
          </h1>
          <p className="text-xs text-white/40 mt-0.5">slug: {job.slug}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Users className="w-3.5 h-3.5" />
          {job._count.applications} طلب
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              اسم الوظيفة (عربي) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              اسم الوظيفة (إنجليزي)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            وصف الوظيفة
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              الأيقونة (Emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              ترتيب الظهور
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
              />
              <span className="text-sm text-white/70">وظيفة نشطة</span>
            </label>
          </div>
        </div>
      </div>

      {/* Associated Questions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-green-400" />
          الأسئلة المرتبطة ({job.questions.length})
        </h2>

        {job.questions.length === 0 ? (
          <p className="text-white/30 text-sm">لا توجد أسئلة مرتبطة بهذه الوظيفة</p>
        ) : (
          <div className="space-y-4">
            {/* Global questions */}
            {globalQuestions.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  أسئلة عامة ({globalQuestions.length})
                </h3>
                <div className="space-y-1">
                  {globalQuestions.map((jq) => (
                    <div
                      key={jq.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 text-sm"
                    >
                      <span className="text-white/50">{jq.question.text}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 mr-auto">
                        {TYPE_LABELS[jq.question.type] || jq.question.type}
                      </span>
                      {jq.question.isRequired && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                          إلزامي
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specific questions */}
            {specificQuestions.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  أسئلة خاصة ({specificQuestions.length})
                </h3>
                <div className="space-y-1">
                  {specificQuestions.map((jq) => (
                    <div
                      key={jq.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 text-sm"
                    >
                      <span className="text-white/50">{jq.question.text}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 mr-auto">
                        {TYPE_LABELS[jq.question.type] || jq.question.type}
                      </span>
                      {jq.question.isRequired && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                          إلزامي
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push('/admin/jobs')}
          className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}
