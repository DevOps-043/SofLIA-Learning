'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DesktopActions } from './landing-header/DesktopActions';
import { DesktopNavLinks } from './landing-header/DesktopNavLinks';
import { HeaderBrand } from './landing-header/HeaderBrand';
import { LANDING_NAV_LINKS } from './landing-header/constants';
import { MobileMenu } from './landing-header/MobileMenu';
import { MobileMenuButton } from './landing-header/MobileMenuButton';
import { useLandingHeaderState } from './landing-header/useLandingHeaderState';

export function LandingHeader() {
  const { t } = useTranslation('common');
  const state = useLandingHeaderState();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${state.isScrolled
        ? 'bg-white shadow-lg shadow-black/5 dark:bg-carbon-900 dark:shadow-black/20'
        : 'bg-white dark:bg-carbon-900'
        }`}
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
    </motion.header>
  );
}
