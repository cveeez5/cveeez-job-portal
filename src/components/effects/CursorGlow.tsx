'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(true);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200, restDelta: 0.001 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    },
    [cursorX, cursorY, visible]
  );

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      setIsTouch(true);
      return;
    }
    setIsTouch(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener(
        'mouseleave',
        handleMouseLeave
      );
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (isTouch) return null;

  return (
    <>
      {/* Outer glow */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full mix-blend-screen"
        style={{
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          width: 400,
          height: 400,
          background:
            'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.02) 40%, transparent 70%)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full"
        style={{
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          width: 8,
          height: 8,
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          boxShadow: '0 0 15px 5px rgba(34, 197, 94, 0.2)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </>
  );
}
