'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DesktopActions } from './landing-header/DesktopActions';
import { DesktopNavLinks } from './landing-header/DesktopNavLinks';
import { HeaderBrand } from './landing-header/HeaderBrand';
import { LANDING_NAV_LINKS } from './landing-header/constants';
import { MobileMenu } from './landing-header/MobileMenu';
import { MobileMenuButton } from './landing-header/MobileMenuButton';
import { useLandingHeaderState } from './landing-header/useLandingHeaderState';
import { warmClientAccess } from './landing-header/prefetch-auth';

export function LandingHeader() {
  const { t } = useTranslation('common');
  const state = useLandingHeaderState();

  // Pre-warm the AuthTabs chunk in browser idle time so it's ready before the
  // user hovers or clicks "Acceso clientes". This eliminates the spinner that
  // appears when the dynamic() chunk is not yet cached on cold starts.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => warmClientAccess(), { timeout: 4000 })
    } else {
      const timer = setTimeout(warmClientAccess, 2500)
      return () => clearTimeout(timer)
    }
  }, []);

  // CSS animation instead of Framer Motion: the slide-in runs before React
  // hydrates so the header (and the "Acceso clientes" button inside it) is
  // visible and clickable from the very first paint — no JS required.
  return (
    <header
      className={[
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        'animate-[header-slide-down_0.6s_cubic-bezier(0.16,1,0.3,1)_both]',
        state.isScrolled
          ? 'bg-white shadow-lg shadow-black/5 dark:bg-carbon-900 dark:shadow-black/20'
          : 'bg-white dark:bg-carbon-900',
      ].join(' ')}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <nav className="flex h-16 items-center justify-between lg:h-20">
          <div className="flex items-center gap-1 lg:gap-2">
            <HeaderBrand />
            <DesktopNavLinks links={LANDING_NAV_LINKS} t={t} />
          </div>

          <DesktopActions state={state} t={t} />
          <MobileMenuButton
            isOpen={state.isMobileMenuOpen}
            onToggle={() => state.setIsMobileMenuOpen(!state.isMobileMenuOpen)}
          />
        </nav>
      </div>

      <MobileMenu state={state} t={t} />
    </header>
  );
}
