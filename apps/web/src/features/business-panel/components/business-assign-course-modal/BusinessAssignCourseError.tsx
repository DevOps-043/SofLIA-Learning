import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import modalStyles from '../ContentModal.module.css';
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
          className={modalStyles.errorNotice}
        >
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: theme.dangerColor }} />
          <span>{modal.error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
