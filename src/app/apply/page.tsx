'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/shared/JobCard';
import { JOBS } from '@/lib/constants';

const Background3D = dynamic(() => import('@/components/3d/Background3D'), {
  ssr: false,
});

export default function ApplyPage() {
  return (
    <>
      <Background3D />
      <Header />

      <main className="relative z-10 min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              اختار الوظيفة المناسبة ليك
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              عندنا {JOBS.length} وظيفة متاحة — اضغط على الوظيفة اللي تناسب مهاراتك وابدأ التقديم
            </p>
          </motion.div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {JOBS.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="glass-card inline-flex items-center gap-3 px-6 py-3">
              <span className="text-lg">💡</span>
              <p className="text-sm text-white/60">
                التسجيل مجاني ومش هياخد أكتر من 3 دقائق — محتاج بس بياناتك الأساسية
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
