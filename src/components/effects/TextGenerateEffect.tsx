'use client';

import { useEffect } from 'react';
import { motion, stagger, useAnimate, useInView } from 'framer-motion';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  duration?: number;
}

export default function TextGenerateEffect({
  words,
  className = '',
  duration = 0.5,
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true });
  const wordArray = words.split(' ');

  useEffect(() => {
    if (isInView) {
      animate(
        'span',
        { opacity: 1, filter: 'blur(0px)' },
        { duration, delay: stagger(0.08) }
      );
    }
  }, [isInView, animate, duration]);

  return (
    <div ref={scope} className={className}>
      {wordArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="inline-block opacity-0 mx-[3px]"
          style={{ filter: 'blur(8px)' }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
