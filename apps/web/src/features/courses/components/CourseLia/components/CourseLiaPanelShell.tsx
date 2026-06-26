import type { ReactNode, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { NAVBAR_HEIGHT, PANEL_WIDTH } from '../constants';
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
  const panelWidth = isMobile ? '100%' : `${PANEL_WIDTH}px`;
  const panelHeight = isMobile ? '100dvh' : `calc(100dvh - ${NAVBAR_HEIGHT}px - max(env(safe-area-inset-bottom, 0px), 0px))`;
  const panelTop = isMobile ? '0' : `${NAVBAR_HEIGHT}px`;
  const panelZIndex = isMobile ? 100 : 45;
  const animationInitial = isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 };
  const animationExit = isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          data-tour-id="course-learn--soflia-panel"
          ref={panelRef}
          initial={animationInitial}
          animate={animationAnimate}
          exit={animationExit}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: panelTop,
            right: isMobile ? 0 : 8,
            width: panelWidth,
            height: isMobile ? panelHeight : `calc(100dvh - ${NAVBAR_HEIGHT}px - 16px - max(env(safe-area-inset-bottom, 0px), 0px))`,
            marginTop: isMobile ? 0 : 8,
            backgroundColor: themeColors.panelBg,
            borderLeft: isMobile ? 'none' : `1px solid ${themeColors.borderColor}`,
            borderTop: 'none',
            borderRadius: isMobile ? 0 : 12,
            zIndex: panelZIndex,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile
              ? 'none'
              : `-4px 0 20px rgba(0, 0, 0, 0.1), 0 -2px 0 ${themeColors.panelBg}`,
            overflow: 'hidden',
          }}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
