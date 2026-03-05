'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string; // e.g. "5000+" or "98%" or "50"
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 2000,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!isInView) return;

    // Extract numeric part and suffix
    const match = value.match(/^([\d,]+)(.*)/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const numericStr = match[1].replace(/,/g, '');
    const suffix = match[2] || '';
    const target = parseInt(numericStr, 10);

    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (progress >= 1) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current.toLocaleString('en') + suffix);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
