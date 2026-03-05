'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
} from 'lucide-react';

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
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  REVIEWED: 'تمت المراجعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  SHORTLISTED: 'قائمة مختصرة',
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

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
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الطلبات</h1>
          <p className="text-sm text-white/40 mt-1">
            إجمالي {pagination?.total || 0} طلب
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            className="glass-input pr-10 w-full"
            placeholder="ابحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <select
            className="glass-select pr-10 min-w-[160px]"
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
                        <p className="text-sm font-medium text-white">{app.name}</p>
                        <p className="text-xs text-white/40">{app.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white/70">
                          {app.job.icon} {app.job.title}
                        </span>
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
                  <div>
                    <p className="font-medium text-white text-sm">{app.name}</p>
                    <p className="text-xs text-white/40">{app.email}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColors[app.status] || ''}`}
                  >
                    {statusLabels[app.status] || app.status}
                  </span>
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/40">
                صفحة {page} من {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
