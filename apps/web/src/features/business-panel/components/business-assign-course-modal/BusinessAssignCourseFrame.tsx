import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseFrameProps {
  children: ReactNode;
  modal: BusinessAssignCourseModalState;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseFrame({ children, modal, theme }: BusinessAssignCourseFrameProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center overflow-hidden p-0 sm:p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={modal.handleClose}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden bg-transparent shadow-2xl sm:h-[min(calc(var(--soflia-viewport-height)-3rem),850px)] sm:max-h-[850px] sm:rounded-[2.5rem]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col h-full overflow-hidden border" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
