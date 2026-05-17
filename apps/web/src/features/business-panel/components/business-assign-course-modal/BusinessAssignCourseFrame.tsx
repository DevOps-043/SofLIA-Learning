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
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate" style={{ zIndex: 99999 }}>
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
          className="relative w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[850px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
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
