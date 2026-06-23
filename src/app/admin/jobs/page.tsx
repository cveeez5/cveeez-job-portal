'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Edit, Eye, EyeOff, Users, HelpCircle, Loader2 } from 'lucide-react';

interface JobFromDB {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { applications: number; questions: number };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (job: JobFromDB) => {
    setToggling(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isActive: !j.isActive } : j))
        );
      }
    } catch (error) {
      console.error('Error toggling job:', error);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 mt-3 text-sm">جاري تحميل الوظائف...</p>
      </div>
    );
  }

  const activeCount = jobs.filter((j) => j.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-green-400" />
            الوظائف
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {jobs.length} وظيفة ({activeCount} نشطة)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`glass-card p-5 transition-colors group ${
              job.isActive ? 'hover:bg-white/10' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{job.icon}</span>
                <div>
                  <h3 className="font-bold text-white">{job.title}</h3>
                  <p className="text-xs text-white/40">{job.titleEn}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                  title="تعديل"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => toggleActive(job)}
                  disabled={toggling === job.id}
                  className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                    job.isActive
                      ? 'text-green-400 hover:text-red-400'
                      : 'text-red-400 hover:text-green-400'
                  }`}
                  title={job.isActive ? 'إيقاف' : 'تفعيل'}
                >
                  {toggling === job.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : job.isActive ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-white/50 mb-3">{job.description}</p>

            <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-white/30">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {job._count.applications} طلب
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                {job._count.questions} سؤال
              </span>
              <span className="mr-auto">
                {job.isActive ? (
                  <span className="text-green-400/60">نشطة</span>
                ) : (
                  <span className="text-red-400/60">متوقفة</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
