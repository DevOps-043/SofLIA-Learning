'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronRight, Loader2, Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '@/core/hooks/useOrganization';
import type { Organization } from '@/core/stores/organizationStore';
import { getOrganizationDashboardPath } from '@/core/utils/organizationNavigation';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';
import styles from './SelectOrganization.module.css';

export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const {
    organizations: userOrganizations = [],
    isLoading,
    isHydrated,
    setCurrentOrganization,
  } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const handleSelectOrganization = useCallback(
    async (org: Organization) => {
      setSelectedOrg(org.id);
      setIsNavigating(true);
      setCurrentOrganization(org);

      let targetUrl = redirectTo;
      if (targetUrl === '/dashboard' || targetUrl === '/') {
        targetUrl = getOrganizationDashboardPath(org);
      } else if (
        targetUrl.startsWith('/') &&
        !targetUrl.startsWith(`/${org.slug}`)
      ) {
        targetUrl = `/${org.slug}${targetUrl}`;
      }

      router.push(targetUrl);
    },
    [redirectTo, router, setCurrentOrganization],
  );

  useEffect(() => {
    if (
      !isLoading &&
      isHydrated &&
      userOrganizations.length === 1
    ) {
      void handleSelectOrganization(userOrganizations[0]);
    }
  }, [
    handleSelectOrganization,
    isHydrated,
    isLoading,
    userOrganizations,
  ]);

  useEffect(() => {
    if (!isLoading && isHydrated && userOrganizations.length === 0) {
      router.replace(redirectTo);
    }
  }, [
    isHydrated,
    isLoading,
    redirectTo,
    router,
    userOrganizations.length,
  ]);

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

  const getRoleIcon = (role: string) =>
    role === 'owner' || role === 'admin' ? (
      <Shield className="h-3 w-3" aria-hidden="true" />
    ) : (
      <Users className="h-3 w-3" aria-hidden="true" />
    );

  const getRoleClass = (role: string) => {
    if (role === 'owner') return styles.roleOwner;
    if (role === 'admin') return styles.roleAdmin;
    return styles.roleMember;
  };

  if (isLoading || !isHydrated || userOrganizations.length <= 1) {
    return (
      <AuthExperience>
        <div className={authExperienceStyles.content}>
          <header className={authExperienceStyles.header}>
            <span className={authExperienceStyles.iconBadge}>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </span>
            <p className={authExperienceStyles.subtitle}>
              {isLoading
                ? t('selectOrganization.loading')
                : t('selectOrganization.redirecting')}
            </p>
          </header>
        </div>
      </AuthExperience>
    );
  }

  return (
    <AuthExperience variant="wide">
      <div className={authExperienceStyles.content}>
        <header className={authExperienceStyles.header}>
          <h1 className={authExperienceStyles.title}>
            {t('selectOrganization.title')}
          </h1>
          <p className={authExperienceStyles.subtitle}>
            {t('selectOrganization.subtitlePrefix')}{' '}
            <strong>{userOrganizations.length}</strong>{' '}
            {t('selectOrganization.subtitleSuffix')}
          </p>
        </header>

        <div className={styles.grid}>
          {userOrganizations.map((org, index) => {
            const isSelected = selectedOrg === org.id;
            const organizationLogo = org.brandLogoUrl || org.logoUrl;

            return (
              <motion.button
                key={org.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.42,
                  delay: Math.min(index * 0.06, 0.3),
                }}
                onClick={() => void handleSelectOrganization(org)}
                disabled={isNavigating}
                className={`${styles.card} ${
                  isSelected ? styles.cardSelected : ''
                } ${
                  isNavigating && !isSelected ? styles.cardDimmed : ''
                }`}
              >
                <span className={styles.cardTop}>
                  <span className={styles.logoFrame}>
                    {organizationLogo ? (
                      <img
                        src={organizationLogo}
                        alt={`Logo de ${org.name}`}
                        className={styles.logo}
                      />
                    ) : (
                      <span className={styles.fallbackLogo}>
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <span className={styles.action}>
                    {isSelected && isNavigating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </span>
                </span>

                <span className={styles.cardBody}>
                  <strong className={styles.cardTitle}>{org.name}</strong>
                  <span className={styles.meta}>
                    <span
                      className={`${styles.role} ${getRoleClass(org.role)}`}
                    >
                      {getRoleIcon(org.role)}
                      {getRoleLabel(org.role)}
                    </span>
                    {org.slug && (
                      <span className={styles.slug}>/{org.slug}</span>
                    )}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <p className={styles.footer}>{t('selectOrganization.footer')}</p>
      </div>
    </AuthExperience>
  );
}
