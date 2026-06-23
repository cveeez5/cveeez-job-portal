'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Save,
  HelpCircle,
  Plus,
  X,
  Loader2,
} from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'TEXT', label: 'نص قصير' },
  { value: 'TEXTAREA', label: 'نص طويل' },
  { value: 'EMAIL', label: 'بريد إلكتروني' },
  { value: 'PHONE', label: 'رقم هاتف' },
  { value: 'NUMBER', label: 'رقم' },
  { value: 'SELECT', label: 'قائمة اختيار' },
  { value: 'MULTI_SELECT', label: 'اختيار متعدد' },
  { value: 'RADIO', label: 'اختيار واحد (أزرار)' },
  { value: 'CHECKBOX', label: 'صح/خطأ' },
  { value: 'FILE', label: 'رفع ملف' },
  { value: 'IMAGE', label: 'رفع صورة' },
  { value: 'URL', label: 'رابط' },
  { value: 'DATE', label: 'تاريخ' },
  { value: 'PORTFOLIO', label: 'رابط أعمال سابقة' },
];

const TYPES_WITH_OPTIONS = ['SELECT', 'MULTI_SELECT', 'RADIO'];

interface Job {
  id: string;
  title: string;
  slug: string;
  icon: string;
}

export default function QuestionEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [text, setText] = useState('');
  const [type, setType] = useState('TEXT');
  const [placeholder, setPlaceholder] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.byJob) {
        const jobList = data.byJob.map((s: { jobId: string; jobTitle: string; jobIcon: string }) => ({
          id: s.jobId,
          title: s.jobTitle,
          icon: s.jobIcon,
        }));
        setJobs(jobList);
      }
    } catch {
      // Fallback: fetch from DB directly
      try {
        const res = await fetch('/api/questions?global=true');
        const data = await res.json();
        const jobSet = new Map<string, Job>();
        (data.data || []).forEach(
          (q: { jobs: Array<{ job: Job }> }) =>
            q.jobs?.forEach((jq) => jobSet.set(jq.job.id, jq.job))
        );
        setJobs(Array.from(jobSet.values()));
      } catch {}
    }
  }, []);

  const fetchQuestion = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${params.id}`);
      if (!res.ok) {
        router.push('/admin/questions');
        return;
      }
      const data = await res.json();
      setText(data.text);
      setType(data.type);
      setPlaceholder(data.placeholder || '');
      setOptions(data.options || []);
      setIsRequired(data.isRequired);
      setIsGlobal(data.isGlobal);
      setSortOrder(data.sortOrder);
      setSelectedJobIds(data.jobs?.map((jq: { job: Job }) => jq.job.id) || []);
    } catch {
      router.push('/admin/questions');
    } finally {
      setLoading(false);
    }
  }, [isNew, params.id, router]);

  useEffect(() => {
    fetchJobs();
    fetchQuestion();
  }, [fetchJobs, fetchQuestion]);

  const handleSave = async () => {
    if (!text.trim()) return;

    setSaving(true);
    try {
      const body = {
        text,
        type,
        placeholder: placeholder || null,
        options: TYPES_WITH_OPTIONS.includes(type) ? options : [],
        isRequired,
        isGlobal,
        sortOrder,
        jobIds: isGlobal ? [] : selectedJobIds,
      };

      const url = isNew ? '/api/questions' : `/api/questions/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/admin/questions');
      }
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 mt-3 text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/questions')}
          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-400" />
            {isNew ? 'إضافة سؤال جديد' : 'تعديل السؤال'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-6 space-y-5">
        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            نص السؤال <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب نص السؤال هنا..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            نوع السؤال
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-green-500/50"
          >
            {QUESTION_TYPES.map((qt) => (
              <option key={qt.value} value={qt.value}>
                {qt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Placeholder */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            نص توضيحي (Placeholder)
          </label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="نص يظهر داخل الحقل كدليل..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Options (for SELECT, MULTI_SELECT, RADIO) */}
        {TYPES_WITH_OPTIONS.includes(type) && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              الخيارات
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {opt}
                  </span>
                  <button
                    onClick={() => removeOption(i)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="أضف خيار جديد..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
                />
                <button
                  onClick={addOption}
                  className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort order */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            ترتيب الظهور
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
            />
            <span className="text-sm text-white/70">إلزامي</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => setIsGlobal(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
            />
            <span className="text-sm text-white/70">سؤال عام (لكل الوظائف)</span>
          </label>
        </div>

        {/* Job selection (if not global) */}
        {!isGlobal && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              الوظائف المرتبطة
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => toggleJobSelection(job.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedJobIds.includes(job.id)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>{job.icon}</span>
                  <span>{job.title}</span>
                </button>
              ))}
            </div>
            {jobs.length === 0 && (
              <p className="text-xs text-white/30 mt-1">
                لا توجد وظائف متاحة. تأكد من إنشاء الوظائف أولاً.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push('/admin/questions')}
          className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isNew ? 'إنشاء السؤال' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
