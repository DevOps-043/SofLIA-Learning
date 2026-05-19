import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseErrorProps {
  modal: BusinessAssignCourseModalState;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseError({ modal, theme }: BusinessAssignCourseErrorProps) {
  return (
    <AnimatePresence>
      {modal.error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 6.3%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 12.5%, transparent)` }}
        >
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: theme.dangerColor }} />
          <span className="text-[10px] font-black uppercase flex-1" style={{ color: theme.dangerColor }}>{modal.error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
