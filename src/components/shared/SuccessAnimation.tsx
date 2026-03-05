'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        {/* Glow ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-green-500/20 blur-xl"
          style={{ width: 120, height: 120, top: -10, left: -10 }}
        />

        <CheckCircle className="w-24 h-24 text-green-500" strokeWidth={1.5} />
      </motion.div>

      {/* Confetti-like particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          animate={{
            opacity: 0,
            y: -80 - Math.random() * 60,
            x: (Math.random() - 0.5) * 160,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#22c55e', '#4ade80', '#10b981', '#34d399'][i % 4],
            top: '40%',
            left: '50%',
          }}
        />
      ))}
    </div>
  );
}
