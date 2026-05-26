'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../../core/providers/I18nProvider';
import { useThemeStore } from '../../../../../core/stores/themeStore';
import { ModernNavbarBrand } from './modern-navbar/ModernNavbarBrand';
import { UserDropdown } from '@/core/components/UserDropdown';
import { ModernNavbarMobileMenu } from './modern-navbar/ModernNavbarMobileMenu';
import type { ModernNavbarProps } from './modern-navbar/types';
import { useModernNavbar } from './modern-navbar/useModernNavbar';
import { useOrganization } from '../../../../../core/hooks/useOrganization';
import { NotificationBell } from '@/core/components/NotificationBell';
import { TourTriggerButton } from '@/features/tours';

export function ModernNavbar({
  organization,
  user,
  orgRole,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout,
  styles,
  disableHeavyEffects = false,
  onCertificatesClick,
  onAnalyticsClick,
  certificatesCount = 0,
  onRestartTour,
}: ModernNavbarProps) {
  const canAccessAdminPanel = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'superadmin';
  const { canSwitch } = useOrganization();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['business', 'common']);
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
  } = useModernNavbar(styles, resolvedTheme, initializeTheme, organization?.slug);

  return (
    <>
      <nav
        data-tour-id="business-user-dashboard--top-nav"
        className={`sticky top-0 z-[120] w-full ${disableHeavyEffects ? '' : 'backdrop-blur-xl'}`}
        style={{
          backgroundColor: colors.navBg,
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${colors.accent} 18.8%, transparent), color-mix(in srgb, ${colors.primary} 18.8%, transparent), transparent)`,
          }}
        />

        <div className="w-full max-w-[1920px] mx-auto pl-2 pr-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-8">
          <div className="flex h-16 items-center justify-between">
            <ModernNavbarBrand colors={colors} organization={organization} t={t} />

            <div
              data-tour-id="business-user-dashboard--account-actions"
              className="flex items-center gap-2 sm:gap-4"
            >
              <div data-tour-id="business-user-dashboard--notifications">
                <NotificationBell />
              </div>

              {onRestartTour ? (
                <TourTriggerButton
                  onStart={onRestartTour}
                  className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-accent"
                />
              ) : null}

              <div className="hidden md:block relative" ref={dropdownRef}>
                <UserDropdown
                  user={user}
                  onCertificatesClick={onCertificatesClick}
                  onAnalyticsClick={onAnalyticsClick}
                  certificatesCount={certificatesCount}
                />
              </div>

              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border-2 transition-all duration-300"
                style={{
                  backgroundColor: mobileMenuOpen ? `color-mix(in srgb, ${colors.primary} 8.2%, transparent)` : 'transparent',
                  borderColor: mobileMenuOpen ? colors.borderActive : colors.border,
                }}
                whileTap={disableHeavyEffects ? undefined : { scale: 0.95 }}
              >
                <motion.div
                  animate={disableHeavyEffects ? undefined : { rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={disableHeavyEffects ? undefined : { duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" style={{ color: colors.accent }} />
                  ) : (
                    <Menu className="h-5 w-5" style={{ color: `color-mix(in srgb, ${colors.text} 50.2%, transparent)` }} />
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
            organization={organization}
            resolvedTheme={resolvedTheme}
            router={router}
            setLanguage={setLanguage}
            setTheme={setTheme}
            t={t}
            theme={theme}
            user={user}
            disableHeavyEffects={disableHeavyEffects}
            showOrganizations={canSwitch}
          />,
          document.body
        )}
    </>
  );
}
