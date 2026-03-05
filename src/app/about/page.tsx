'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import QRCodeGrid from '@/components/qr/QRCodeGrid';
import { COMPANY } from '@/lib/constants';

const Background3D = dynamic(() => import('@/components/3d/Background3D'), {
  ssr: false,
});

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const services = [
  { icon: '📄', title: 'كتابة السيرة الذاتية', desc: 'سير ذاتية احترافية بالعربي والإنجليزي مع تصميمات مميزة' },
  { icon: '🤖', title: 'التوظيف بالذكاء الاصطناعي', desc: 'نستخدم AI لمطابقة المرشحين مع الوظائف المناسبة' },
  { icon: '🎨', title: 'تصميم الهوية البصرية', desc: 'تصميم لوجو وبراند كامل لشركتك أو مشروعك' },
  { icon: '💼', title: 'استشارات التوظيف', desc: 'نصائح ودعم لتحسين فرصك في سوق العمل' },
  { icon: '📊', title: 'تحليل السوق', desc: 'تحليل سوق العمل وتحديد الفرص المتاحة' },
  { icon: '🎓', title: 'التدريب والتطوير', desc: 'كورسات وورش عمل لتطوير مهاراتك المهنية' },
];

export default function AboutPage() {
  return (
    <>
      <Background3D />
      <Header />

      <main className="relative z-10 min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm text-green-400">عن الشركة</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">{COMPANY.name}</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">{COMPANY.description}</p>
            <p className="text-xl text-green-400 font-bold mt-3">{COMPANY.slogan}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {[
              { value: COMPANY.stats.cvsCreated, label: 'سيرة ذاتية' },
              { value: COMPANY.stats.happyUsers, label: 'عميل سعيد' },
              { value: COMPANY.stats.templates, label: 'قالب جاهز' },
              { value: COMPANY.stats.satisfaction, label: 'نسبة الرضا' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Services */}
          <motion.div
            className="mb-16"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">خدماتنا</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="glass-card p-5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-3xl mb-3 block">{service.icon}</span>
                  <h3 className="font-bold text-white mb-1">{service.title}</h3>
                  <p className="text-sm text-white/50">{service.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* QR Codes */}
          <motion.div
            className="mb-16"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white text-center mb-2">تواصل معانا</h2>
            <p className="text-white/50 text-center mb-8 text-sm">
              امسح QR Code أو اضغط على أي رابط للتواصل
            </p>
            <QRCodeGrid />
          </motion.div>

          {/* Contact Section */}
          <motion.div
            className="glass-card p-6 sm:p-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-white mb-6 text-center">معلومات التواصل</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-sm text-white/50">الموقع</p>
                    <p className="text-white">{COMPANY.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="text-sm text-white/50">البريد الإلكتروني</p>
                    <a
                      href={`mailto:${COMPANY.email}`}
                      className="text-green-400 hover:underline"
                    >
                      {COMPANY.email}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {COMPANY.phones.map((phone) => (
                  <div key={phone.number} className="flex items-start gap-3">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="text-sm text-white/50">{phone.label}</p>
                      <a
                        href={`tel:${phone.number}`}
                        dir="ltr"
                        className="text-green-400 hover:underline"
                      >
                        {phone.number}
                      </a>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3">
                  <span className="text-xl">🕐</span>
                  <div>
                    <p className="text-sm text-white/50">الدعم الفني</p>
                    <p className="text-white text-sm">
                      {COMPANY.supportPhone.number} ({COMPANY.supportPhone.hours})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="mt-6 pt-6 border-t border-white/5 flex justify-center gap-3 flex-wrap">
              <a
                href={COMPANY.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                🌐 الموقع
              </a>
              <a
                href={COMPANY.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                📘 فيسبوك
              </a>
              <a
                href={COMPANY.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                💼 لينكدإن
              </a>
              <a
                href={COMPANY.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                📸 إنستجرام
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
