'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, Shield, Users } from 'lucide-react';
import { Joyride } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { TourRestartButton } from '@/core/components/tours/TourRestartButton';
import { useOrganization } from '@/core/hooks/useOrganization';
import { SELECT_ORGANIZATION_TOUR_TARGET_IDS } from '@/core/constants/tourTargets';
import type { Organization } from '@/core/stores/organizationStore';
import { useThemeStore } from '@/core/stores/themeStore';
import { getOrganizationDashboardPath } from '@/core/utils/organizationNavigation';
import { useJoyrideMinitour } from '@/features/tours/hooks/useJoyrideMinitour';
import {
  SELECT_ORGANIZATION_MINITOUR_ID,
  buildSelectOrganizationMinitourSteps,
} from '@/features/tours/config/select-organization-minitour-steps';

/**
 * Organization Selection Page
 *
 * Shown after login when a user belongs to multiple organizations.
 * Allows them to choose which organization context to enter.
 */
export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const { organizations: userOrganizations = [], isLoading, isHydrated, setCurrentOrganization } = useOrganization();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  // Get redirect URL from query params (where to go after selection)
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const tourSteps = useMemo(
    () => buildSelectOrganizationMinitourSteps((key) => String(t(key))),
    [t],
  );
  const organizationTour = useJoyrideMinitour({
    enabled: !isLoading && userOrganizations.length > 1,
    label: String(t('tour.restart')),
    steps: tourSteps,
    tourId: SELECT_ORGANIZATION_MINITOUR_ID,
  });

  const ui = {
    pageBg: isDark ? '#050B14' : '#F4F8FC',
    orbPrimary: isDark ? '#0A2540' : '#BFDBFE',
    orbSecondary: isDark ? '#00D4B3' : '#99F6E4',
    headerSurface: isDark ? 'rgba(10, 18, 30, 0.58)' : 'rgba(255, 255, 255, 0.74)',
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 37, 64, 0.08)',
    headerShadow: isDark ? '0 24px 60px rgba(0, 0, 0, 0.28)' : '0 24px 60px rgba(15, 23, 42, 0.08)',
    heading: isDark ? '#F8FAFC' : '#0A2540',
    subtitle: isDark ? 'rgba(226, 232, 240, 0.74)' : '#475569',
    counter: isDark ? '#FFFFFF' : '#0F172A',
    cardBg: isDark ? 'rgba(22, 28, 38, 0.84)' : 'rgba(255, 255, 255, 0.92)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 37, 64, 0.12)',
    selectedBg: isDark ? 'rgba(10, 37, 64, 0.45)' : 'rgba(226, 241, 255, 0.94)',
    selectedBorder: isDark ? 'rgba(0, 212, 179, 0.42)' : 'rgba(10, 37, 64, 0.22)',
    selectedShadow: isDark
      ? '0 18px 44px rgba(0, 212, 179, 0.18), 0 0 0 1px rgba(0, 212, 179, 0.22)'
      : '0 18px 44px rgba(10, 37, 64, 0.12), 0 0 0 1px rgba(10, 37, 64, 0.12)',
    cardShadow: isDark ? '0 18px 40px rgba(0, 0, 0, 0.18)' : '0 14px 34px rgba(15, 23, 42, 0.06)',
    cardTitle: isDark ? '#F8FAFC' : '#0F172A',
    cardSlug: isDark ? 'rgba(203, 213, 225, 0.74)' : '#64748B',
    fallbackLogoBg: isDark ? '#0F1419' : '#EEF4FB',
    fallbackLogoBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 37, 64, 0.1)',
    fallbackLogoText: isDark ? '#00D4B3' : '#0A2540',
    actionBg: isDark ? '#00D4B3' : '#0A2540',
    actionText: isDark ? '#0A1724' : '#FFFFFF',
    actionIdleBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(10, 37, 64, 0.04)',
    actionIdleText: isDark ? 'rgba(203, 213, 225, 0.82)' : '#64748B',
    actionGlow: isDark ? '0 0 24px rgba(0, 212, 179, 0.24)' : '0 0 20px rgba(10, 37, 64, 0.16)',
    loader: isDark ? '#00D4B3' : '#0A2540',
    dot: isDark ? '#00D4B3' : '#0A2540',
    shimmerMid: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(10, 37, 64, 0.03)',
  };

  const handleSelectOrganization = useCallback(async (org: Organization) => {
    setSelectedOrg(org.id);
    setIsNavigating(true);

    setCurrentOrganization(org);

    let targetUrl = redirectTo;

    if (targetUrl === '/dashboard' || targetUrl === '/') {
      targetUrl = getOrganizationDashboardPath(org);
    } else if (targetUrl.startsWith('/') && !targetUrl.startsWith(`/${org.slug}`)) {
      targetUrl = `/${org.slug}${targetUrl}`;
    }

    router.push(targetUrl);
  }, [redirectTo, router, setCurrentOrganization]);

  // If user has only one org, auto-select and redirect
  useEffect(() => {
    if (!isLoading && isHydrated && userOrganizations.length === 1) {
      handleSelectOrganization(userOrganizations[0]);
    }
  }, [handleSelectOrganization, isLoading, isHydrated, userOrganizations]);

  // If user has no orgs, redirect to regular dashboard (B2C user)
  useEffect(() => {
    if (!isLoading && isHydrated && userOrganizations.length === 0) {
      router.replace(redirectTo);
    }
  }, [isLoading, isHydrated, userOrganizations, redirectTo, router]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return t('selectOrganization.roles.owner');
      case 'admin':
        return t('selectOrganization.roles.admin');
      case 'member':
        return t('selectOrganization.roles.member');
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          bg: 'bg-amber-100 dark:bg-amber-500/10',
          text: 'text-amber-800 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-500/20',
        };
      case 'admin':
        return {
          bg: 'bg-blue-100 dark:bg-blue-500/10',
          text: 'text-blue-800 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-500/20',
        };
      default:
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-500/10',
          text: 'text-emerald-800 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-500/20',
        };
    }
  };

  if (isLoading || !isHydrated || userOrganizations.length <= 1) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: ui.pageBg }}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
            style={{ backgroundColor: ui.orbPrimary, opacity: isDark ? 0.3 : 0.55 }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
            style={{ backgroundColor: ui.orbSecondary, opacity: isDark ? 0.1 : 0.35 }}
          />
        </div>

        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: ui.loader }} />
          <p className="font-medium tracking-wide text-sm" style={{ color: ui.subtitle }}>
            {isLoading ? t('selectOrganization.loading') : t('selectOrganization.redirecting')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{ backgroundColor: ui.pageBg }}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden select-none pointer-events-none">
        <div
          className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse-slow"
          style={{ backgroundColor: ui.orbPrimary, opacity: isDark ? 0.32 : 0.4 }}
        />
        <div
          className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ backgroundColor: ui.orbSecondary, opacity: isDark ? 0.08 : 0.22 }}
        />

        <div
          className="absolute inset-0"
          style={{
            opacity: isDark ? 0.04 : 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236C757D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl relative z-10"
      >
        <div
          id={SELECT_ORGANIZATION_TOUR_TARGET_IDS.header}
          className="text-center mb-10 rounded-[32px] border backdrop-blur-xl px-6 py-8 md:px-10 md:py-10"
          style={{
            backgroundColor: ui.headerSurface,
            borderColor: ui.headerBorder,
            boxShadow: ui.headerShadow,
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
            style={{ color: ui.heading }}
          >
            {t('selectOrganization.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg max-w-md mx-auto"
            style={{ color: ui.subtitle }}
          >
            {t('selectOrganization.subtitlePrefix')}{' '}
            <span id={SELECT_ORGANIZATION_TOUR_TARGET_IDS.counter} className="font-semibold" style={{ color: ui.counter }}>
              {userOrganizations.length}
            </span>{' '}
            {t('selectOrganization.subtitleSuffix')}
          </motion.p>
        </div>

        <div id={SELECT_ORGANIZATION_TOUR_TARGET_IDS.grid} className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {userOrganizations.map((org, index) => {
            const roleStyle = getRoleStyles(org.role);
            const isSelected = selectedOrg === org.id;

            return (
              <motion.button
                id={index === 0 ? SELECT_ORGANIZATION_TOUR_TARGET_IDS.card : undefined}
                key={org.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 * (index + 2) }}
                onClick={() => handleSelectOrganization(org)}
                disabled={isNavigating}
                className={`
                  group w-full p-6 rounded-2xl border text-left relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[160px]
                  hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-black/20
                  ${isNavigating && !isSelected ? 'opacity-40 blur-[1px]' : ''}
                `}
                style={{
                  backgroundColor: isSelected ? ui.selectedBg : ui.cardBg,
                  borderColor: isSelected ? ui.selectedBorder : ui.cardBorder,
                  boxShadow: isSelected ? ui.selectedShadow : ui.cardShadow,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"
                  style={{
                    background: `linear-gradient(to right, transparent, ${ui.shimmerMid}, transparent)`,
                  }}
                />

                <div className="flex justify-between items-start w-full relative z-10">
                  <div className="h-16 lg:h-20 flex items-center justify-start transition-transform duration-300 group-hover:scale-105 origin-left">
                    {org.brandLogoUrl || org.logoUrl ? (
                      <img
                        src={org.brandLogoUrl || org.logoUrl || ''}
                        alt={org.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl border flex items-center justify-center"
                        style={{
                          backgroundColor: ui.fallbackLogoBg,
                          borderColor: ui.fallbackLogoBorder,
                        }}
                      >
                        <span className="text-3xl font-bold" style={{ color: ui.fallbackLogoText }}>
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    id={index === 0 ? SELECT_ORGANIZATION_TOUR_TARGET_IDS.action : undefined}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 mt-1"
                    style={{
                      backgroundColor: isSelected ? ui.actionBg : ui.actionIdleBg,
                      color: isSelected ? ui.actionText : ui.actionIdleText,
                      boxShadow: isSelected ? ui.actionGlow : 'none',
                    }}
                  >
                    {isSelected && isNavigating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <h3 className="font-bold text-xl truncate" style={{ color: ui.cardTitle }}>
                    {org.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      id={index === 0 ? SELECT_ORGANIZATION_TOUR_TARGET_IDS.role : undefined}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border transition-colors
                        ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}
                      `}
                    >
                      {getRoleIcon(org.role)}
                      {getRoleLabel(org.role)}
                    </span>
                    {org.slug && (
                      <span className="text-xs font-medium truncate" style={{ color: ui.cardSlug }}>
                        /{org.slug}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-sm" style={{ color: ui.subtitle }}>
            {t('selectOrganization.footer')}
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${ui.dot}33` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${ui.dot}66` }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${ui.dot}33` }} />
          </div>
        </motion.div>
      </motion.div>
      <TourRestartButton anchor={{ bottom: 24, right: 24, size: 56 }} />
      {organizationTour.isMounted && organizationTour.run ? (
        <Joyride {...organizationTour.joyrideProps} />
      ) : null}
    </div>
  );
}
