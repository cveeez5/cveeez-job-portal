'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Download,
  Briefcase,
  Loader2,
  ArrowDownWideNarrow,
  Award,
  Calendar,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { JOBS } from '@/lib/constants';
import { scoreTier } from '@/lib/scoring';
import { v2GradeStyle } from '@/lib/scoring-v2';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  job: { title: string; slug: string; icon: string };
  files: Array<{ fileUrl: string; fileName: string }>;
  _count: { answers: number };
  score?: number | null;
  scoreFlags?: number;
  formVersion?: number;
  grade?: string | null;
  knockoutReason?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  REVIEWED: 'bg-blue-500/20 text-blue-400',
  ACCEPTED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  SHORTLISTED: 'bg-purple-500/20 text-purple-400',
  REJECTED_AUTO: 'bg-red-500/10 text-red-300',
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  REVIEWED: 'تمت المراجعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  SHORTLISTED: 'قائمة مختصرة',
  REJECTED_AUTO: 'مستبعد تلقائياً',
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [scoreBucket, setScoreBucket] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // الترتيب الافتراضي بالدرجة تنازلياً — الأعلى درجة أول القايمة
  const [sortByScore, setSortByScore] = useState(true);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [knockoutCount, setKnockoutCount] = useState<number | null>(null);

  const buildParams = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (jobFilter) params.set('job', jobFilter);
      if (scoreBucket) params.set('scoreBucket', scoreBucket);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (sortByScore) params.set('sort', 'score');
      Object.entries(extra || {}).forEach(([k, v]) => params.set(k, v));
      return params;
    },
    [search, statusFilter, jobFilter, scoreBucket, dateFrom, dateTo, sortByScore]
  );

  const activeFilters =
    !!search || !!statusFilter || !!jobFilter || !!scoreBucket || !!dateFrom || !!dateTo;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setJobFilter('');
    setScoreBucket('');
    setDateFrom('');
    setDateTo('');
    setSortByScore(true);
    setPage(1);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams({ page: page.toString(), limit: pageSize.toString() });
      const res = await fetch(`/api/applications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [buildParams, page, pageSize]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // نصدّر نفس النتائج المفلترة (من غير ترتيب/صفحات)
      const params = buildParams();
      params.delete('sort');
      const res = await fetch(`/api/admin/export?${params}`);
      if (!res.ok) {
        alert('فشل تصدير الملف');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = jobFilter
        ? `applications-${jobFilter}-${date}.xlsx`
        : `applications-all-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // عدّاد المستبعدات تلقائياً — بيخليهم ظاهرين من الصفحة الرئيسية من غير ما
  // يزحموا أول القايمة (هما مرتّبين آخر حاجة لأن مفيش ليهم درجة)
  useEffect(() => {
    const params = new URLSearchParams({ scoreBucket: 'knockout', limit: '1' });
    if (jobFilter) params.set('job', jobFilter);
    fetch(`/api/applications?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setKnockoutCount(data?.pagination?.total ?? null))
      .catch(() => setKnockoutCount(null));
  }, [jobFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('أنت متأكد إنك عايز تحذف الطلب ده؟')) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">الطلبات</h1>
          <p className="text-sm text-white/40 mt-1">
            إجمالي {pagination?.total || 0} طلب
            {jobFilter && ` (مفلتر بوظيفة: ${JOBS.find((j) => j.id === jobFilter)?.title || jobFilter})`}
          </p>
          {!!knockoutCount && (
            <button
              type="button"
              onClick={() => {
                setScoreBucket(scoreBucket === 'knockout' ? '' : 'knockout');
                setPage(1);
              }}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                scoreBucket === 'knockout'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-red-500/5 border-red-500/20 text-red-300/70 hover:bg-red-500/10'
              }`}
              title="عرض المتقدمات اللي اتستبعدوا من بوابة الفلترة"
            >
              🚫 {knockoutCount} مستبعدة تلقائياً
              {scoreBucket === 'knockout' && <X className="w-3 h-3" />}
            </button>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
          title="تصدير الطلبات إلى Excel (شيت لكل وظيفة)"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              تصدير Excel
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        {/* صف البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            className="glass-input pr-10 w-full"
            placeholder="ابحث بالاسم أو الإيميل أو الموبايل..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* صف الفلاتر */}
        <div className="flex flex-wrap items-end gap-3">
          <FilterField label="الوظيفة" icon={<Briefcase className="w-3.5 h-3.5" />}>
            <select
              className="glass-select pr-9 min-w-[150px]"
              value={jobFilter}
              onChange={(e) => {
                setJobFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الوظائف</option>
              {JOBS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.icon} {j.title}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="الحالة" icon={<Filter className="w-3.5 h-3.5" />}>
            <select
              className="glass-select pr-9 min-w-[140px]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="الدرجة" icon={<Award className="w-3.5 h-3.5" />}>
            <select
              className="glass-select pr-9 min-w-[150px]"
              value={scoreBucket}
              onChange={(e) => {
                setScoreBucket(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الدرجات</option>
              <optgroup label="تصنيف فورم المودريتور">
                <option value="gradeA">A — مرشحة قوية (75+)</option>
                <option value="gradeB">B — قائمة انتظار (60–74)</option>
                <option value="gradeC">C — أقل من 60</option>
                <option value="knockout">🚫 مستبعدة تلقائياً</option>
              </optgroup>
              <optgroup label="شرايح الدرجة">
                <option value="excellent">ممتاز (80%+)</option>
                <option value="good">جيد جداً (60–79%)</option>
                <option value="mid">متوسط (40–59%)</option>
                <option value="low">ضعيف (أقل من 40%)</option>
              </optgroup>
              <option value="flagged">⚠️ فيها تنبيهات</option>
              <option value="unscored">بدون تقييم (قديمة)</option>
            </select>
          </FilterField>

          <FilterField label="من تاريخ" icon={<Calendar className="w-3.5 h-3.5" />}>
            <input
              type="date"
              dir="ltr"
              className="glass-input text-left min-w-[140px]"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </FilterField>

          <FilterField label="إلى تاريخ" icon={<Calendar className="w-3.5 h-3.5" />}>
            <input
              type="date"
              dir="ltr"
              className="glass-input text-left min-w-[140px]"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </FilterField>

          <button
            type="button"
            onClick={() => {
              setSortByScore((v) => !v);
              setPage(1);
            }}
            className={`flex items-center gap-2 h-[42px] px-4 rounded-xl border transition-colors text-sm whitespace-nowrap ${
              sortByScore
                ? 'bg-green-500/15 border-green-500/30 text-green-400'
                : 'bg-white/5 border-white/5 text-white/50 hover:text-white'
            }`}
            title="ترتيب الطلبات حسب الدرجة الآلية (الأعلى أولاً)"
          >
            <ArrowDownWideNarrow className="w-4 h-4" />
            ترتيب حسب الدرجة
          </button>

          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-2 h-[42px] px-4 rounded-xl border border-white/5 bg-white/5 text-white/50 hover:text-red-400 transition-colors text-sm whitespace-nowrap"
              title="مسح كل الفلاتر"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">مفيش طلبات</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="glass-card overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-right text-xs text-white/40 font-medium p-4">المتقدم</th>
                    <th className="text-right text-xs text-white/40 font-medium p-4">الوظيفة</th>
                    <th className="text-right text-xs text-white/40 font-medium p-4">الدرجة</th>
                    <th className="text-right text-xs text-white/40 font-medium p-4">الحالة</th>
                    <th className="text-right text-xs text-white/40 font-medium p-4">التاريخ</th>
                    <th className="text-right text-xs text-white/40 font-medium p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <p className="text-sm font-medium text-white">
                          {app.name?.trim() || <span className="text-white/25">بدون اسم</span>}
                        </p>
                        <p className="text-xs text-white/40">{app.email}</p>
                        {app.knockoutReason && (
                          <p className="text-[11px] text-red-300/60 mt-1 leading-relaxed">
                            {knockoutAnswer(app.knockoutReason)}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white/70">
                          {app.job.icon} {app.job.title}
                        </span>
                      </td>
                      <td className="p-4">
                        <ScoreBadge app={app} />
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${statusColors[app.status] || ''}`}
                        >
                          {statusLabels[app.status] || app.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-white/40">
                          {formatDate(app.createdAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm">
                      {app.name?.trim() || <span className="text-white/25">بدون اسم</span>}
                    </p>
                    <p className="text-xs text-white/40">{app.email}</p>
                    {app.knockoutReason && (
                      <p className="text-[11px] text-red-300/60 mt-1 leading-relaxed">
                        {knockoutAnswer(app.knockoutReason)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[app.status] || ''}`}
                    >
                      {statusLabels[app.status] || app.status}
                    </span>
                    <ScoreBadge app={app} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>
                    {app.job.icon} {app.job.title}
                  </span>
                  <span>{formatDate(app.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="btn-secondary text-xs flex-1 justify-center"
                  >
                    <Eye className="w-3 h-3" />
                    عرض
                  </Link>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <Paginator
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

/** knockoutReason متخزّن بالشكل: "g1 — نص السؤال → «نص الخيار»". بنعرض الخيار بس. */
function knockoutAnswer(reason: string): string {
  const [, answer] = reason.split('→');
  return (answer || reason).trim();
}

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-white/40 flex items-center gap-1 pr-1">
        {icon}
        {label}
      </span>
      <div className="relative">{children}</div>
    </div>
  );
}

function getPageList(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push('…');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function Paginator({
  page,
  totalPages,
  total,
  limit,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = getPageList(page, Math.max(1, totalPages));

  const navBtn =
    'min-w-[36px] h-9 px-2 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-3 text-xs text-white/40">
        <span>
          بيعرض <span className="text-white/70">{from}</span>–
          <span className="text-white/70">{to}</span> من{' '}
          <span className="text-white/70">{total}</span>
        </span>
        <span className="hidden sm:inline text-white/10">|</span>
        <label className="flex items-center gap-1.5">
          <span>لكل صفحة:</span>
          <select
            className="glass-select py-1 pr-2 text-xs"
            value={pageSize}
            onChange={(e) => onPageSize(parseInt(e.target.value))}
          >
            {[20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(1)}
            disabled={page === 1}
            className={`${navBtn} bg-white/5 text-white/40 hover:text-white`}
            title="الصفحة الأولى"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`${navBtn} bg-white/5 text-white/40 hover:text-white`}
            title="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {pages.map((p, i) =>
            typeof p === 'string' ? (
              <span key={`gap-${i}`} className="px-1 text-white/30 select-none">
                {p}
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`${navBtn} ${
                  p === page
                    ? 'bg-green-500/20 text-green-400 font-bold'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`${navBtn} bg-white/5 text-white/40 hover:text-white`}
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPage(totalPages)}
            disabled={page === totalPages}
            className={`${navBtn} bg-white/5 text-white/40 hover:text-white`}
            title="الصفحة الأخيرة"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ app }: { app: Application }) {
  const { score, scoreFlags: flags, grade, knockoutReason } = app;

  // طلبات v2 المستبعدة مفيش ليها درجة أصلاً
  if (knockoutReason) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-300"
        title={knockoutReason}
      >
        🚫 مستبعدة
      </span>
    );
  }

  if (score === null || score === undefined) {
    return <span className="text-xs text-white/20">—</span>;
  }

  // v2: التصنيف A/B/C هو المؤشر الأساسي. v1: شرايح الدرجة زي ما كانت.
  const style = grade ? v2GradeStyle(grade) : scoreTier(score);
  const title = grade
    ? `التصنيف ${grade}${flags ? ` • ${flags} تنبيه` : ''}`
    : `${scoreTier(score).label}${flags ? ` • ${flags} تنبيه` : ''}`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${style.color}`}
      title={title}
    >
      {grade && <span className="opacity-80">{grade}</span>}
      {score}
      {!grade && '%'}
      {!!flags && flags > 0 && (
        <span className="text-yellow-400" title={`${flags} تنبيه`}>
          ⚠️
        </span>
      )}
    </span>
  );
}
