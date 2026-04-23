import {
  MOBILE_BOTTOM_NAV_HEIGHT,
  NAVBAR_HEIGHT,
  PANEL_WIDTH,
} from './course-lia.constants';

export function getCourseLiaPanelLayout(isMobile: boolean) {
  return {
    panelWidth: isMobile ? '100%' : `${PANEL_WIDTH}px`,
    panelHeight: isMobile
      ? `calc(100vh - ${NAVBAR_HEIGHT}px - ${MOBILE_BOTTOM_NAV_HEIGHT}px)`
      : `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    animationInitial: isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH },
    animationAnimate: isMobile ? { y: 0, opacity: 1 } : { x: 0 },
    animationExit: isMobile ? { y: '100%', opacity: 0 } : { x: PANEL_WIDTH },
  };
}
