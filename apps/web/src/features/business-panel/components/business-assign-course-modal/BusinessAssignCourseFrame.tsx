import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import modalStyles from '../ContentModal.module.css';
import type { BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseFrameProps {
  children: ReactNode;
  modal: BusinessAssignCourseModalState;
  theme: BusinessAssignCourseTheme;
}

export function BusinessAssignCourseFrame({ children, modal, theme }: BusinessAssignCourseFrameProps) {
  const modalVariables = {
    '--modal-accent': theme.accentColor,
    '--modal-action': theme.actionColor,
    '--modal-on-action': theme.onActionColor,
    '--modal-card': theme.cardBg,
    '--modal-surface': theme.panelBg,
    '--modal-text': theme.textColor,
    '--modal-muted': theme.subtextColor,
    '--modal-border': theme.borderColor,
    '--modal-input': theme.inputBg,
    '--modal-divider': theme.dividerColor,
    '--modal-danger': theme.dangerColor,
  } as CSSProperties;

  return (
    <AnimatePresence>
      <div className={modalStyles.overlay}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={modal.handleClose}
          className={modalStyles.backdrop}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          aria-labelledby="assign-course-title"
          aria-modal="true"
          className={`${modalStyles.dialog} ${modalStyles.dialogWide}`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={modalVariables}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
