'use client';

import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../../../core/stores/themeStore';
import { ModernNavbarBrand } from './modern-navbar/ModernNavbarBrand';
import { UserDropdown } from '@/core/components/UserDropdown';
import { USER_DROPDOWN_CLOSE_EVENT } from '@/core/components/UserDropdown/types';
import type { ModernNavbarProps } from './modern-navbar/types';
import { useModernNavbar } from './modern-navbar/useModernNavbar';
import { NotificationBell } from '@/core/components/NotificationBell';
import { TourTriggerButton } from '@/features/tours';

export function ModernNavbar({
  organization,
  user,
  onProfileClick,
  onLogout,
  styles,
  disableHeavyEffects = false,
  onCertificatesClick,
  onAnalyticsClick,
  certificatesCount = 0,
  onRestartTour,
}: ModernNavbarProps) {
  const { t } = useTranslation(['business', 'common']);
  const { resolvedTheme, initializeTheme } = useThemeStore();
  const {
    closeDesktopMenu,
    closeMobileMenu,
    colors,
  } = useModernNavbar(styles, resolvedTheme, initializeTheme, organization?.slug);
  const handleRestartTour = () => {
    closeDesktopMenu();
    closeMobileMenu();
    window.dispatchEvent(new Event(USER_DROPDOWN_CLOSE_EVENT));
    window.requestAnimationFrame(() => {
      onRestartTour?.();
    });
  };

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
                  onStart={handleRestartTour}
                  className="text-gray-600 dark:text-gray-400"
                  style={{ color: colors.accent }}
                />
              ) : null}

              <div className="relative">
                <UserDropdown
                  certificatesCount={certificatesCount}
                  onAnalyticsClick={onAnalyticsClick}
                  onCertificatesClick={onCertificatesClick}
                  onLogout={onLogout}
                  onProfileClick={onProfileClick}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
