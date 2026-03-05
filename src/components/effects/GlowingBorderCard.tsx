'use client';

import { ReactNode, useRef } from 'react';

interface GlowingBorderCardProps {
  children: ReactNode;
  className?: string;
  borderRadius?: string;
}

export default function GlowingBorderCard({
  children,
  className = '',
  borderRadius = '1rem',
}: GlowingBorderCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className={`glowing-border-card relative ${className}`}
      style={{ borderRadius }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'conic-gradient(from var(--border-angle, 0deg), transparent 40%, #22c55e 50%, #4ade80 55%, transparent 60%)',
          borderRadius: 'inherit',
        }}
      />
      {/* Inner card content */}
      <div
        className="relative h-full"
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(16px)',
          borderRadius: 'inherit',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
