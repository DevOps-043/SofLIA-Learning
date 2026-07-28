'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useRef, type PointerEvent, type ReactNode } from 'react';

interface MagnetProps {
  children: ReactNode;
  className?: string;
  /** How strongly the content follows the cursor (0–1). */
  strength?: number;
}

/**
 * Source-integrated from the React Bits Magnet registry component: the
 * wrapped content is gently attracted toward the cursor and springs back
 * on leave. Disabled under reduced-motion preferences.
 */
export function Magnet({ children, className = '', strength = 0.35 }: MagnetProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 320, damping: 22, mass: 0.5 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    x.set((event.clientX - (bounds.left + bounds.width / 2)) * strength);
    y.set((event.clientY - (bounds.top + bounds.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{ x: springX, y: springY, display: 'inline-flex' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
