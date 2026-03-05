'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { COMPANY } from '@/lib/constants';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card mt-4 flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-lg font-bold text-white shadow-lg shadow-green-500/20 transition-transform group-hover:scale-110">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {COMPANY.name}
              </h1>
              <p className="text-[10px] text-green-400/80 -mt-1">
                {COMPANY.slogan}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-green-400 transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/apply"
              className="text-sm text-white/70 hover:text-green-400 transition-colors"
            >
              الوظائف
            </Link>
            <Link
              href="/about"
              className="text-sm text-white/70 hover:text-green-400 transition-colors"
            >
              عن الشركة
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* CTA - hidden on very small screens when menu is shown */}
            <Link
              href="/apply"
              className="hidden sm:inline-flex btn-primary py-2.5 px-5 text-sm"
            >
              قدّم الآن
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="sm:hidden overflow-hidden"
            >
              <nav className="glass-card mt-2 p-4 flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:text-green-400 hover:bg-white/5 transition-colors"
                >
                  🏠 الرئيسية
                </Link>
                <Link
                  href="/apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:text-green-400 hover:bg-white/5 transition-colors"
                >
                  💼 الوظائف
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:text-green-400 hover:bg-white/5 transition-colors"
                >
                  🏢 عن الشركة
                </Link>
                <div className="border-t border-white/5 mt-2 pt-2">
                  <Link
                    href="/apply"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full justify-center text-sm"
                  >
                    قدّم الآن
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
