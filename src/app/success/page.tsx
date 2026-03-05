'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SuccessAnimation from '@/components/shared/SuccessAnimation';
import SpotlightCard from '@/components/effects/SpotlightCard';
import FloatingParticles from '@/components/effects/FloatingParticles';
import { JOBS, COMPANY } from '@/lib/constants';

const Background3D = dynamic(() => import('@/components/3d/Background3D'), {
  ssr: false,
});

function SuccessContent() {
  const searchParams = useSearchParams();
  const jobSlug = searchParams.get('job');
  const job = JOBS.find((j) => j.id === jobSlug);

  return (
    <>
      <Background3D />
      <Header />

      <main className="relative z-10 min-h-screen flex items-center justify-center pt-20 pb-20 px-4">
        <FloatingParticles count={25} />
        <div className="max-w-lg w-full relative z-10">
          <SpotlightCard className="glass-card p-8 sm:p-10 text-center rounded-2xl" spotlightColor="rgba(34, 197, 94, 0.2)">
            <SuccessAnimation />

            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-6 mb-3">
              تم إرسال طلبك بنجاح! 🎉
            </h1>

            {job && (
              <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/20 rounded-full px-4 py-2 mb-4">
                <span>{job.icon}</span>
                <span className="text-sm text-green-400 font-medium">{job.title}</span>
              </div>
            )}

            <p className="text-white/60 mb-6 leading-relaxed">
              شكراً لتقديمك على الوظيفة في{' '}
              <span className="text-green-400 font-bold">{COMPANY.name}</span>.
              <br />
              هنتواصل معاك خلال{' '}
              <span className="text-white font-bold">48 ساعة</span> على الإيميل
              أو رقم الموبايل اللي سجلت بيهم.
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 text-right">
              <h3 className="text-sm font-semibold text-white/80 mb-3">📌 الخطوات الجاية:</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  هيتم مراجعة طلبك من فريقنا
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  لو ملفك مناسب هنتواصل معاك لمقابلة أونلاين
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  تابع إيميلك وموبايلك عشان أي تحديثات
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/" className="btn-primary justify-center btn-glow">
                الصفحة الرئيسية
              </a>
              <a href="/apply" className="btn-secondary justify-center btn-glow">
                قدّم على وظيفة تانية
              </a>
            </div>

            {/* Contact info */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-xs text-white/30 mb-2">لو عندك أي استفسار تواصل معانا:</p>
              <div className="flex justify-center gap-4">
                <a
                  href={`tel:${COMPANY.phones[0].number}`}
                  className="text-xs text-green-400/60 hover:text-green-400"
                >
                  📞 {COMPANY.phones[0].number}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-xs text-green-400/60 hover:text-green-400"
                >
                  📧 {COMPANY.email}
                </a>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
