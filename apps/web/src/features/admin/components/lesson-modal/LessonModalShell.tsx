import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface LessonModalShellProps {
  children: ReactNode;
  onClose: () => void;
}

export function LessonModalShell({ children, onClose }: LessonModalShellProps) {
  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              data-testid="lesson-modal-panel"
              className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </>
    </AnimatePresence>
  );
}
