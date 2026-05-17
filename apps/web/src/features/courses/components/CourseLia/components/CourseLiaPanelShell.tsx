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
  const panelBottomOffset = isMobile
    ? 'calc(70px + max(env(safe-area-inset-bottom, 0px), 8px))'
    : 'max(env(safe-area-inset-bottom, 0px), 0px)';
  const panelHeight = `calc(100dvh - ${NAVBAR_HEIGHT}px - ${panelBottomOffset})`;
  const animationInitial = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };
  const animationAnimate = isMobile ? { y: 0, opacity: 1 } : { x: 0 };
  const animationExit = isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={panelRef}
          initial={animationInitial}
          animate={animationAnimate}
          exit={animationExit}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: `${NAVBAR_HEIGHT}px`,
            right: 0,
            width: panelWidth,
            height: panelHeight,
            backgroundColor: themeColors.panelBg,
            borderLeft: isMobile ? 'none' : `1px solid ${themeColors.borderColor}`,
            borderTop: 'none',
            borderTopLeftRadius: isMobile ? '20px' : 0,
            borderTopRightRadius: isMobile ? '20px' : 0,
            zIndex: 45,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile
              ? '0 -8px 32px rgba(0, 0, 0, 0.3)'
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
