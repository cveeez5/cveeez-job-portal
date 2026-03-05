'use client';

import { useState, useEffect, useMemo } from 'react';

interface FloatingParticlesProps {
  count?: number;
}

export default function FloatingParticles({ count = 20 }: FloatingParticlesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate stable random values only once on client
  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: count }, () => ({
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 10 + 10,
    }));
  }, [mounted, count]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="floating-particle absolute rounded-full bg-green-400/20"
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
