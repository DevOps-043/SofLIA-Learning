'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

export function SecondaryGuideButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08, x: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-200 dark:bg-carbon-800 hover:bg-gray-200/80 dark:hover:bg-primary/30 text-primary dark:text-white font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-500/30 text-xs sm:text-sm overflow-hidden group"
      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
      type="button"
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export function PrimaryGuideButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08, boxShadow: '0 8px 24px color-mix(in srgb, var(--color-accent) 40%, transparent)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-primary/30 dark:shadow-primary/20 text-xs sm:text-sm overflow-hidden group"
      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
      type="button"
    >
      <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.6, ease: 'easeInOut' }} />
      <span className="relative z-10">{children}</span>
      <motion.span className="relative z-10" whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
        <ChevronRight size={16} className="sm:w-4 sm:h-4" />
      </motion.span>
    </motion.button>
  );
}

export function CompleteGuideButton({
  children,
  disableHeavy,
  onClick,
}: {
  children: ReactNode;
  disableHeavy: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)' }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-success via-emerald-600 to-teal-600 text-white font-bold shadow-xl shadow-green-500/30 dark:shadow-green-500/20 text-sm sm:text-base overflow-hidden group"
      type="button"
    >
      <motion.div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
      <motion.span className="relative z-10" animate={disableHeavy ? {} : { scale: [1, 1.05] }} transition={{ type: 'tween', duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}>
        {children}
      </motion.span>
    </motion.button>
  );
}
