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
        {/* z-[1000]: el AdminHeader es sticky con z-[999]; con menos z-index el
            topbar tapa el encabezado del modal. Mismo patrón que MaterialModal. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-[1000] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              data-testid="lesson-modal-panel"
              className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800 sm:max-w-4xl"
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
