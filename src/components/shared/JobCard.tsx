'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import TiltCard from '@/components/effects/TiltCard';
import SpotlightCard from '@/components/effects/SpotlightCard';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  index: number;
}

export default function JobCard({ job, index }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/apply/${job.id}`}>
        <TiltCard className="rounded-2xl" tiltAmount={10}>
          <SpotlightCard className="rounded-2xl">
            <div
              className={cn(
                'glass-card p-6 cursor-pointer group relative overflow-hidden',
                'hover:border-green-500/30',
              )}
            >
              {/* Gradient background */}
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  job.color,
                )}
              />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">{job.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                <p className="text-xs text-white/50 mb-3">{job.titleEn}</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  {job.description}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <span>قدّم الآن</span>
                  <motion.span
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ←
                  </motion.span>
                </div>
              </div>

              {/* Corner glow */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-green-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </SpotlightCard>
        </TiltCard>
      </Link>
    </motion.div>
  );
}
