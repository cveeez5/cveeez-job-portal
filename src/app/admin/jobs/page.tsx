'use client';

import { JOBS } from '@/lib/constants';
import { Briefcase } from 'lucide-react';

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">الوظائف</h1>
        <p className="text-sm text-white/40 mt-1">
          قائمة بجميع الوظائف المتاحة ({JOBS.length} وظيفة)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOBS.map((job) => (
          <div key={job.id} className="glass-card p-5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{job.icon}</span>
              <div>
                <h3 className="font-bold text-white">{job.title}</h3>
                <p className="text-xs text-white/40">{job.titleEn}</p>
              </div>
            </div>
            <p className="text-sm text-white/50 mb-3">{job.description}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
              <Briefcase className="w-3 h-3 text-green-400/50" />
              <span className="text-xs text-white/30">slug: {job.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
