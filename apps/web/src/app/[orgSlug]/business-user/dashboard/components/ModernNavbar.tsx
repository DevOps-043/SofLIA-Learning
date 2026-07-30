'use client';

import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../../../core/stores/themeStore';
import { ModernNavbarBrand } from './modern-navbar/ModernNavbarBrand';
import { UserDropdown } from '@/core/components/UserDropdown';
import { USER_DROPDOWN_CLOSE_EVENT } from '@/core/components/UserDropdown/types';
import type { ModernNavbarProps } from './modern-navbar/types';
import { useModernNavbar } from './modern-navbar/useModernNavbar';
import { NotificationBell } from '@/core/components/NotificationBell';
import { TourTriggerButton } from '@/features/tours';
import dashboardStyles from '../page-components/BusinessUserDashboard.module.css';

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
        data-motion={disableHeavyEffects ? 'reduced' : 'full'}
        className={dashboardStyles.navShell}
      >
        <div
          className={dashboardStyles.navBar}
          style={{ '--dashboard-nav-bg': colors.navBg } as CSSProperties}
        >
          <div className={dashboardStyles.navInner}>
            <ModernNavbarBrand colors={colors} organization={organization} t={t} />

            <div
              data-tour-id="business-user-dashboard--account-actions"
              className="flex items-center gap-1.5 sm:gap-2"
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
