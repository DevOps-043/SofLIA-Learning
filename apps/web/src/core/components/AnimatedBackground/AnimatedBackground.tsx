'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedBackgroundProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Static positions generated once at module level (not per-render).
// The previous implementation called Math.random() inside the component body,
// which means every parent re-render produced NEW random positions → layout
// shifts on every render cycle.
// ---------------------------------------------------------------------------
const FLOATING_ELEMENTS = [
  { id: 0, x: 15, y: 20, size: 48, delay: 0,   duration: 14 },
  { id: 1, x: 72, y: 60, size: 32, delay: 2.5, duration: 18 },
  { id: 2, x: 45, y: 80, size: 60, delay: 5,   duration: 12 },
] as const;

// Shared transition factories — defined outside the component so they are
// not recreated on every render.
function floatTransition(duration: number, delay: number) {
  return { duration, delay, repeat: Infinity, ease: 'easeInOut' as const };
}

export function AnimatedBackground({ className = '' }: AnimatedBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  // When the user has prefers-reduced-motion enabled (or on slow devices that
  // set this via user-agent), render a completely static background. This is
  // also the right accessibility behaviour.
  if (shouldReduceMotion) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <div
          className="absolute inset-0 opacity-5"
          style={{ background: 'radial-gradient(circle at 30% 40%, rgba(10,37,64,0.1) 0%, transparent 50%)' }}
        />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>

      {/*
        REMOVED: two motion.div elements that animated the `background` CSS
        property (radial-gradient). Animating `background` is NOT compositable
        on the GPU — the browser must repaint on the CPU every frame (~60×/s).
        On mobile this was the primary source of the overheating.

        KEPT: only transform-based animations (x, y, scale) which the browser
        compositor handles entirely on the GPU with no CPU involvement.
      */}

      {/* Static ambient gradient — GPU-composited opacity layer, never repainted */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: 'radial-gradient(circle at 30% 40%, rgba(10,37,64,0.15) 0%, transparent 55%), radial-gradient(circle at 70% 70%, rgba(0,212,179,0.10) 0%, transparent 55%)' }}
      />

      {/*
        3 floating elements (reduced from 6).
        Animations: y, x, scale only — all compile to CSS `transform`,
        handled by the GPU compositor thread without touching the CPU render
        pipeline. `rotate` was removed because it adds a full matrix
        multiplication per frame with negligible visual benefit.
      */}
      {FLOATING_ELEMENTS.map((el) => (
        <motion.div
          key={el.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.size}px`,
            height: `${el.size}px`,
            background: 'linear-gradient(135deg, rgba(10,37,64,0.08), rgba(0,212,179,0.08))',
            willChange: 'transform', // hint browser to promote to its own GPU layer
          }}
          animate={{ y: [0, -16, 8, -12, 0], x: [0, 10, -8, 4, 0], scale: [1, 1.08, 0.94, 1.04, 1] }}
          transition={floatTransition(el.duration, el.delay)}
        />
      ))}
    </div>
  );
}
