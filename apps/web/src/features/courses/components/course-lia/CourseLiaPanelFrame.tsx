import type { ReactNode, RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { CourseLiaThemeColors } from './CourseLia.types';
import { NAVBAR_HEIGHT } from './course-lia.constants';
import { getCourseLiaPanelLayout } from './course-lia-layout';

interface CourseLiaPanelFrameProps {
  children: ReactNode;
  isMobile: boolean;
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement>;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaPanelFrame({
  children,
  isMobile,
  isOpen,
  panelRef,
  themeColors,
}: CourseLiaPanelFrameProps) {
  const layout = getCourseLiaPanelLayout(isMobile);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={panelRef}
          initial={layout.animationInitial}
          animate={layout.animationAnimate}
          exit={layout.animationExit}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: `${NAVBAR_HEIGHT}px`,
            right: 0,
            width: layout.panelWidth,
            height: layout.panelHeight,
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
