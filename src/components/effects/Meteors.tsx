'use client';

import { useState, useEffect, useMemo } from 'react';

interface MeteorsProps {
  number?: number;
}

export default function Meteors({ number = 12 }: MeteorsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const meteors = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: number }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.floor(Math.random() * 4 + 4),
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
    }));
  }, [mounted, number]);

  if (!mounted) return null;

  return (
    <>
      {meteors.map((m, idx) => (
        <span
          key={idx}
          className="meteor animate-meteor-effect absolute rounded-full bg-green-400 shadow-[0_0_0_1px_#ffffff10]"
          style={{
            top: '-5px',
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            width: `${m.width}px`,
            height: `${m.height}px`,
          }}
        />
      ))}
    </>
  );
}
