'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SpotlightCard from '@/components/effects/SpotlightCard';
import TextGenerateEffect from '@/components/effects/TextGenerateEffect';
import AnimatedCounter from '@/components/effects/AnimatedCounter';
import TiltCard from '@/components/effects/TiltCard';
import Meteors from '@/components/effects/Meteors';
import FloatingParticles from '@/components/effects/FloatingParticles';
import MagneticButton from '@/components/effects/MagneticButton';
import { COMPANY, JOBS } from '@/lib/constants';
import { Briefcase, Users, FileText, Sparkles, ArrowLeft } from 'lucide-react';

const Background3D = dynamic(() => import('@/components/3d/Background3D'), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Background3D />
      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-24 relative overflow-hidden">
          {/* Meteors in hero */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Meteors number={15} />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge with shimmer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8 relative overflow-hidden"
              >
                <div className="shimmer absolute inset-0 rounded-full" />
                <Sparkles className="w-4 h-4 text-green-400 relative z-10" />
                <span className="text-sm text-green-400 font-medium relative z-10">
                  فرص عمل جديدة متاحة الآن
                </span>
              </motion.div>

              {/* Title with animated gradient */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
                انضم لفريق{' '}
                <span className="gradient-text-animated">{COMPANY.name}</span>
              </h1>

              {/* Subtitle with text generate effect */}
              <TextGenerateEffect
                words="سجّل في الوظيفة المناسبة ليك وابدأ رحلتك المهنية معانا — التسجيل سهل وبسيط ومش هياخد أكتر من 3 دقائق"
                className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                duration={0.4}
              />

              {/* CTA Buttons with glow */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton strength={0.3}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/apply" className="btn-primary btn-glow text-lg px-10 py-4">
                      <Briefcase className="w-5 h-5" />
                      تصفح الوظائف وقدّم الآن
                    </Link>
                  </motion.div>
                </MagneticButton>
                <MagneticButton strength={0.3}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/about" className="btn-secondary text-lg px-8 py-4">
                      تعرف على CVEEEZ
                    </Link>
                  </motion.div>
                </MagneticButton>
              </div>
            </motion.div>

            {/* Stats with SpotlightCard + AnimatedCounter */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20"
            >
              {[
                { icon: <FileText className="w-5 h-5" />, value: COMPANY.stats.cvsCreated, label: 'سيرة ذاتية' },
                { icon: <Users className="w-5 h-5" />, value: COMPANY.stats.happyUsers, label: 'مستخدم سعيد' },
                { icon: '📋', value: `${COMPANY.stats.templates}`, label: 'قالب احترافي' },
                { icon: '⭐', value: COMPANY.stats.satisfaction, label: 'رضا العملاء' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <SpotlightCard className="glass-card p-4 text-center rounded-2xl">
                    <div className="flex justify-center mb-2 text-green-400 relative z-10">
                      {typeof stat.icon === 'string' ? (
                        <span className="text-xl">{stat.icon}</span>
                      ) : (
                        stat.icon
                      )}
                    </div>
                    <AnimatedCounter
                      value={stat.value}
                      className="text-2xl font-bold text-white block relative z-10"
                    />
                    <p className="text-xs text-white/50 mt-1 relative z-10">{stat.label}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Jobs Preview Section with 3D tilt cards */}
        <section className="py-20 px-4 relative">
          <FloatingParticles count={15} />
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block text-green-400 text-sm font-medium mb-3 tracking-wide"
              >
                — اختار تخصصك —
              </motion.span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                الوظائف المتاحة
              </h2>
              <p className="text-white/50 max-w-lg mx-auto">
                اختار الوظيفة اللي تناسب مهاراتك وقدّم عليها دلوقتي
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {JOBS.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/apply/${job.id}`}>
                    <TiltCard className="rounded-2xl">
                      <SpotlightCard className="glass-card p-5 text-center cursor-pointer group rounded-2xl">
                        <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-300 relative z-10">
                          {job.icon}
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 relative z-10">
                          {job.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-white/40 relative z-10">{job.titleEn}</p>
                        {/* Hidden arrow that appears on hover */}
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 relative z-10">
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            قدّم الآن <ArrowLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </SpotlightCard>
                    </TiltCard>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Link href="/apply" className="btn-primary btn-glow px-8">
                عرض جميع الوظائف والتقديم
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How it works — with enhanced cards */}
        <section className="py-20 px-4 relative">
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                إزاي تقدم؟
              </h2>
              <p className="text-white/50">3 خطوات بسيطة وخلاص</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: '💼',
                  title: 'اختار الوظيفة',
                  desc: 'تصفح الوظائف المتاحة واختار اللي تناسبك',
                  color: 'rgba(34, 197, 94, 0.15)',
                },
                {
                  step: '2',
                  icon: '📝',
                  title: 'املا البيانات',
                  desc: 'املا بياناتك الأساسية وجاوب على أسئلة بسيطة',
                  color: 'rgba(74, 222, 128, 0.12)',
                },
                {
                  step: '3',
                  icon: '✅',
                  title: 'استنى التواصل',
                  desc: 'هنراجع طلبك ونتواصل معاك خلال 48 ساعة',
                  color: 'rgba(16, 185, 129, 0.12)',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <SpotlightCard
                    className="glass-card p-6 text-center relative rounded-2xl overflow-hidden"
                    spotlightColor={item.color}
                  >
                    {/* Step number badge */}
                    <div className="absolute -top-3 right-4 w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-green-500/30 z-20">
                      {item.step}
                    </div>
                    {/* Connector line */}
                    {i < 2 && (
                      <div className="hidden sm:block absolute top-1/2 -left-3 w-6 h-[2px] bg-gradient-to-l from-green-500/40 to-transparent" />
                    )}
                    <div className="text-4xl mb-4 relative z-10 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 relative z-10">{item.title}</h3>
                    <p className="text-sm text-white/50 relative z-10">{item.desc}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
