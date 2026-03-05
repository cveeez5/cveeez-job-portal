'use client';

import { useState, useEffect } from 'react';
import { FileText, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  byJob: Array<{
    jobId: string;
    jobTitle: string;
    jobIcon: string;
    count: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'إجمالي الطلبات',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'قيد المراجعة',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-yellow-400 bg-yellow-500/10',
    },
    {
      label: 'مقبولين',
      value: stats?.accepted || 0,
      icon: CheckCircle,
      color: 'text-green-400 bg-green-500/10',
    },
    {
      label: 'مرفوضين',
      value: stats?.rejected || 0,
      icon: Users,
      color: 'text-red-400 bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-sm text-white/40 mt-1">نظرة عامة على الطلبات والإحصائيات</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Applications by Job */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h2 className="text-lg font-semibold text-white">الطلبات حسب الوظيفة</h2>
        </div>

        {stats?.byJob && stats.byJob.length > 0 ? (
          <div className="space-y-3">
            {stats.byJob
              .sort((a, b) => b.count - a.count)
              .map((job) => {
                const maxCount = Math.max(...stats.byJob.map((j) => j.count));
                const percentage = maxCount > 0 ? (job.count / maxCount) * 100 : 0;

                return (
                  <div key={job.jobId} className="flex items-center gap-3">
                    <span className="text-lg w-8 text-center">{job.jobIcon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/80">{job.jobTitle}</span>
                        <span className="text-sm font-bold text-white">{job.count}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-white/30 py-8">مفيش طلبات لسه</p>
        )}
      </div>
    </div>
  );
}
