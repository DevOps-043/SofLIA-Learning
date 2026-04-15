'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../../core/providers/I18nProvider';
import { useThemeStore } from '../../../../../core/stores/themeStore';
import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../core/constants/tourTargets';
import { ModernNavbarBrand } from './modern-navbar/ModernNavbarBrand';
import { ModernNavbarDesktopMenu } from './modern-navbar/ModernNavbarDesktopMenu';
import { ModernNavbarMobileMenu } from './modern-navbar/ModernNavbarMobileMenu';
import type { ModernNavbarProps } from './modern-navbar/types';
import { useModernNavbar } from './modern-navbar/useModernNavbar';

export function ModernNavbar({
  organization,
  user,
  orgRole,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout,
  styles,
  onRestartTour,
}: ModernNavbarProps) {
  const canAccessAdminPanel = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'superadmin';
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation('business');
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore();
  const {
    activeSubmenu,
    colors,
    closeDesktopMenu,
    closeMobileMenu,
    dropdownRef,
    hasStudyPlan,
    mounted,
    mobileMenuOpen,
    setActiveSubmenu,
    setMobileMenuOpen,
    setUserDropdownOpen,
    userDropdownOpen,
  } = useModernNavbar(styles, resolvedTheme, initializeTheme);

  return (
    <>
      <nav
        className="sticky top-0 z-[120] w-full backdrop-blur-xl"
        style={{
          backgroundColor: colors.navBg,
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}30, ${colors.primary}30, transparent)`,
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto pl-2 pr-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-8">
          <div className="flex h-16 items-center justify-between">
            <ModernNavbarBrand colors={colors} organization={organization} t={t} />

            <div className="flex items-center gap-3">
              <div className="hidden md:block relative" ref={dropdownRef}>
                <ModernNavbarDesktopMenu
                  activeSubmenu={activeSubmenu}
                  canAccessAdminPanel={canAccessAdminPanel}
                  colors={colors}
                  getDisplayName={getDisplayName}
                  getInitials={getInitials}
                  hasStudyPlan={hasStudyPlan}
                  language={language}
                  onClose={closeDesktopMenu}
                  onLogout={onLogout}
                  onProfileClick={onProfileClick}
                  onRestartTour={onRestartTour}
                  organization={organization}
                  resolvedTheme={resolvedTheme}
                  router={router}
                  setActiveSubmenu={setActiveSubmenu}
                  setLanguage={setLanguage}
                  setTheme={setTheme}
                  setUserDropdownOpen={setUserDropdownOpen}
                  t={t}
                  theme={theme}
                  user={user}
                  userDropdownOpen={userDropdownOpen}
                />
              </div>

              <motion.button
                id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.mobileMenuTrigger}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border-2 transition-all duration-300"
                style={{
                  backgroundColor: mobileMenuOpen ? `${colors.primary}15` : 'transparent',
                  borderColor: mobileMenuOpen ? colors.borderActive : colors.border,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div animate={{ rotate: mobileMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" style={{ color: colors.accent }} />
                  ) : (
                    <Menu className="h-5 w-5" style={{ color: `${colors.text}80` }} />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {mounted &&
        createPortal(
          <ModernNavbarMobileMenu
            canAccessAdminPanel={canAccessAdminPanel}
            colors={colors}
            getDisplayName={getDisplayName}
            getInitials={getInitials}
            hasStudyPlan={hasStudyPlan}
            isOpen={mobileMenuOpen}
            language={language}
            onClose={closeMobileMenu}
            onLogout={onLogout}
            onProfileClick={onProfileClick}
            onRestartTour={onRestartTour}
            organization={organization}
            resolvedTheme={resolvedTheme}
            router={router}
            setLanguage={setLanguage}
            setTheme={setTheme}
            t={t}
            theme={theme}
            user={user}
          />,
          document.body
        )}
    </>
  );
}
