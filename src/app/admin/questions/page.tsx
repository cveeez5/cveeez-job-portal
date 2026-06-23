'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Search,
  Globe,
  Briefcase,
  Trash2,
  Edit,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface QuestionJob {
  job: { id: string; title: string; slug: string; icon: string };
}

interface Question {
  id: string;
  text: string;
  type: string;
  placeholder: string | null;
  options: string[];
  isRequired: boolean;
  isGlobal: boolean;
  sortOrder: number;
  createdAt: string;
  jobs: QuestionJob[];
  _count: { answers: number };
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

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'specific'>('all');
  const [filterJob, setFilterJob] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/questions';
      const params = new URLSearchParams();
      if (filterType === 'global') params.set('global', 'true');
      if (filterJob) params.set('job', filterJob);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterJob]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (searchQuery && !q.text.includes(searchQuery)) return false;
    if (filterType === 'global' && !q.isGlobal) return false;
    if (filterType === 'specific' && q.isGlobal) return false;
    return true;
  });

  const globalCount = questions.filter((q) => q.isGlobal).length;
  const specificCount = questions.filter((q) => !q.isGlobal).length;

  // Get unique jobs from questions
  const availableJobs = Array.from(
    new Map(
      questions
        .flatMap((q) => q.jobs)
        .map((jq) => [jq.job.slug, jq.job])
    ).values()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-green-400" />
            إدارة الأسئلة
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {questions.length} سؤال ({globalCount} عام + {specificCount} خاص بالوظائف)
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة سؤال
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="ابحث في الأسئلة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'global' | 'specific')}
            className="bg-white/5 border border-white/10 rounded-xl pr-10 pl-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-green-500/50 min-w-[160px]"
          >
            <option value="all">كل الأسئلة</option>
            <option value="global">أسئلة عامة فقط</option>
            <option value="specific">أسئلة خاصة فقط</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>

        {/* Job filter */}
        {availableJobs.length > 0 && (
          <div className="relative">
            <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pr-10 pl-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-green-500/50 min-w-[160px]"
            >
              <option value="">كل الوظائف</option>
              {availableJobs.map((job) => (
                <option key={job.slug} value={job.slug}>
                  {job.icon} {job.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 mt-3 text-sm">جاري تحميل الأسئلة...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">لا توجد أسئلة</p>
          <p className="text-white/20 text-sm mt-1">
            {searchQuery ? 'جرب تبحث بكلمة مختلفة' : 'ابدأ بإضافة أسئلة جديدة'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="glass-card p-4 hover:bg-white/8 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {question.isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400">
                        <Globe className="w-3 h-3" />
                        عام
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/50">
                      {TYPE_LABELS[question.type] || question.type}
                    </span>
                    {question.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">
                        إلزامي
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-medium text-sm">{question.text}</h3>

                  {/* Options preview */}
                  {question.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.options.slice(0, 5).map((opt, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40"
                        >
                          {opt}
                        </span>
                      ))}
                      {question.options.length > 5 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                          +{question.options.length - 5} أخرى
                        </span>
                      )}
                    </div>
                  )}

                  {/* Jobs this question belongs to */}
                  {!question.isGlobal && question.jobs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.jobs.map((jq) => (
                        <span
                          key={jq.job.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400"
                        >
                          {jq.job.icon} {jq.job.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-white/20 mt-2">
                    {question._count.answers} إجابة
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/questions/${question.id}`}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(question.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm === question.id && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <p className="text-xs text-red-400">هل أنت متأكد من حذف هذا السؤال؟</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-xs rounded-lg bg-white/5 text-white/60 hover:bg-white/10"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
