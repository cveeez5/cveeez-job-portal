'use client';

import Link from 'next/link';
import { COMPANY } from '@/lib/constants';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a1020]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-lg font-bold text-white">
                C
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{COMPANY.name}</h3>
                <p className="text-xs text-green-400/80">{COMPANY.slogan}</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              {COMPANY.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">روابط سريعة</h4>
            <div className="flex flex-col gap-2">
              <Link href="/apply" className="text-sm text-white/50 hover:text-green-400 transition-colors">
                الوظائف المتاحة
              </Link>
              <Link href="/about" className="text-sm text-white/50 hover:text-green-400 transition-colors">
                عن CVEEEZ
              </Link>
              <a href={COMPANY.socials.website} target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-green-400 transition-colors">
                الموقع الرسمي
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">تواصل معنا</h4>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <a href={`mailto:${COMPANY.email}`} className="hover:text-green-400 transition-colors">
                📧 {COMPANY.email}
              </a>
              <a href={`tel:${COMPANY.phones[0].number}`} className="hover:text-green-400 transition-colors" dir="ltr">
                📞 {COMPANY.phones[0].number}
              </a>
              <p>🕐 الدعم: {COMPANY.supportPhone.hours}</p>
            </div>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-4">
              <a href={COMPANY.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-blue-500/20 hover:text-blue-400 transition-all">
                📘
              </a>
              <a href={COMPANY.socials.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-blue-600/20 hover:text-blue-500 transition-all">
                💼
              </a>
              <a href={COMPANY.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-pink-500/20 hover:text-pink-400 transition-all">
                📸
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} {COMPANY.name}. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-white/30 flex items-center gap-1">
            صُنع بـ <Heart className="w-3 h-3 text-red-400 fill-red-400" /> بواسطة فريق {COMPANY.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
