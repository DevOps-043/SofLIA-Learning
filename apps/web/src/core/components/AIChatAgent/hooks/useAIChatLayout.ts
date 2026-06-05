'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

export function useAIChatLayout() {
  const pathname = usePathname();

  const [isDesktop, setIsDesktop] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState<string | null>(null);
  const [windowHeight, setWindowHeight] = useState(600);

  const isCommunitiesPage = pathname?.includes('/communities') ?? false;

  const hasDashboardNavbar = useMemo(() => {
    if (!pathname) return false;
    const dashboardPrefixes = [
      '/dashboard', '/my-courses', '/courses', '/prompt-directory', '/apps-directory',
      '/communities', '/news', '/statistics', '/questionnaire', '/account-settings', '/certificates',
    ];
    return dashboardPrefixes.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  const bottomPosition = isCommunitiesPage && !isDesktop
    ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(1.5rem + env(safe-area-inset-bottom, 0px))';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === 'undefined') return;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const topGap = hasDashboardNavbar ? (!isDesktop ? 78 : 72) + 8 : 24;
      const bottomGap = isCommunitiesPage && !isDesktop ? 88 : 24;
      const availableHeight = viewportHeight - topGap - bottomGap;
      const mobileMinimumHeight = Math.min(260, Math.max(180, viewportHeight - 16));
      const computed = Math.max(availableHeight, isDesktop ? 360 : mobileMinimumHeight);
      setWidgetHeight(`${computed}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const calculateMaxHeight = useMemo(() => {
    if (widgetHeight) return widgetHeight;
    if (isCommunitiesPage && !isDesktop) return 'calc(var(--soflia-viewport-height) - 5.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
    if (hasDashboardNavbar) {
      const navbarHeight = !isDesktop ? '4.875rem' : '4.5rem';
      return `calc(var(--soflia-viewport-height) - ${navbarHeight} - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)`;
    }
    return 'calc(var(--soflia-viewport-height) - 1.5rem - env(safe-area-inset-bottom, 0px) - 1.5rem)';
  }, [isCommunitiesPage, hasDashboardNavbar, isDesktop, widgetHeight]);

  return {
    isDesktop,
    widgetHeight,
    windowHeight,
    isCommunitiesPage,
    hasDashboardNavbar,
    bottomPosition,
    calculateMaxHeight,
  };
}
