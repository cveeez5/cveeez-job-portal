'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MODERATOR_V2_REJECTION_MESSAGE } from '@/lib/moderator-v2';

/**
 * شاشة الاعتذار بعد الاستبعاد التلقائي.
 * من غير ما نقول السبب — الرسالة موحّدة لكل حالات الاستبعاد.
 */
export default function KnockoutScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="text-center py-6 space-y-6"
      role="status"
      aria-live="polite"
    >
      <div className="text-5xl">💚</div>

      <p className="text-base sm:text-lg text-white/85 leading-loose max-w-md mx-auto">
        {MODERATOR_V2_REJECTION_MESSAGE}
      </p>

      <div className="pt-2">
        <Link href="/apply" className="btn-secondary inline-flex">
          شوفي باقي الوظائف
        </Link>
      </div>
    </motion.div>
  );
}
