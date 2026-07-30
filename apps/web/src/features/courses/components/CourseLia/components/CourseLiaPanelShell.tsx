import type { CSSProperties, ReactNode, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PANEL_WIDTH } from '../constants';
import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaThemeColors } from '../types';

interface CourseLiaPanelShellProps {
  children: ReactNode;
  isMobile: boolean;
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement>;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaPanelShell({
  children,
  isMobile,
  isOpen,
  panelRef,
  themeColors,
}: CourseLiaPanelShellProps) {
  const animationInitial = isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 };
  const animationExit = isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 };
  const themeVariables = {
    '--course-lia-panel': themeColors.panelBg,
    '--course-lia-border': themeColors.borderColor,
    '--course-lia-accent': themeColors.accentColor,
    '--course-lia-text': themeColors.textPrimary,
    '--course-lia-muted': themeColors.textSecondary,
    '--course-lia-input': themeColors.inputBg,
    '--course-lia-input-border': themeColors.inputBorder,
    '--course-lia-assistant-bubble': themeColors.messageBubbleAssistant,
    '--course-lia-user-bubble': themeColors.messageBubbleUser,
    '--course-lia-primary': themeColors.primaryAction,
  } as CSSProperties;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          data-tour-id="course-learn--soflia-panel"
          ref={panelRef}
          initial={animationInitial}
          animate={animationAnimate}
          exit={animationExit}
          transition={{ type: 'spring', damping: 30, stiffness: 260, mass: 0.85 }}
          className={`${styles.panel} ${isMobile ? styles.panelMobile : ''}`}
          style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? 0 : 12,
            right: isMobile ? 0 : 12,
            bottom: isMobile ? 'auto' : 12,
            width: isMobile ? '100%' : `${PANEL_WIDTH}px`,
            height: isMobile ? '100dvh' : 'auto',
            marginTop: 0,
            ...themeVariables,
          }}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
