'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  PartyPopper,
  Shield,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import {
  AuthExperience,
  authExperienceStyles,
} from '@/features/auth/components/AuthExperience';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons/SocialLoginButtons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getInvitationErrorTranslationKey,
  getInvitationRoleTranslationKey,
} from '@/features/auth/services/invitation-i18n.service';
import { useLanguage } from '@/core/providers/I18nProvider';

interface InviteData {
  id: string;
  name: string;
  role: string;
  remainingUses: number;
  expiresAt: string;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  googleLoginEnabled?: boolean;
  microsoftLoginEnabled?: boolean;
}

interface InviteResponse {
  success: boolean;
  valid: boolean;
  invite?: InviteData;
  organization?: OrganizationData;
  error?: string;
  reason?: string;
}

type PageState = 'loading' | 'valid' | 'invalid' | 'error';

const roleColors: Record<string, string> = {
  member: 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  admin: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  owner: 'text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const token = params?.token as string;
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [errorKey, setErrorKey] = useState('');
  const [errorReason, setErrorReason] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [acceptedOrgSlug, setAcceptedOrgSlug] = useState<string | null>(null);
  const [actionErrorKey, setActionErrorKey] = useState('');

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      setErrorKey('auth.invitation.errors.missingToken');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invite/${token}`);
        const data: InviteResponse = await response.json();

        if (data.success && data.valid && data.invite && data.organization) {
          setInvite(data.invite);
          setOrganization(data.organization);
          setPageState('valid');
          return;
        }

        setErrorKey(
          getInvitationErrorTranslationKey({
            error: data.error,
            reason: data.reason,
          }),
        );
        setErrorReason(data.reason || 'unknown');
        setPageState('invalid');
      } catch {
        setErrorKey('auth.invitation.errors.verifyFailed');
        setPageState('error');
      }
    };

    void validateToken();
  }, [token]);

  const primaryColor = organization?.primaryColor || 'var(--color-legacy-14b8a6)';
  const authBrand = organization
    ? {
        logoUrl: organization.logoUrl || '/icono.png',
        name: organization.name,
        primaryColor,
      }
    : undefined;

  const handleCreateAccount = () => {
    if (organization?.slug) {
      router.push(`/auth/${organization.slug}/register?bulk_token=${token}`);
    }
  };

  const handleLogin = () => {
    if (organization?.slug) {
      router.push(`/auth/${organization.slug}?bulk_token=${token}`);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user?.id || !token) return;

    setAccepting(true);
    setActionErrorKey('');
    try {
      const response = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        credentials: 'same-origin',
      });
      const data = await response.json();

      if (data.success) {
        setAlreadyMember(Boolean(data.alreadyMember));
        setAccepted(true);
        setAcceptedOrgSlug(data.organizationSlug);
      } else if (response.status === 401 || response.status === 403) {
        await refreshUser();
        setActionErrorKey(
          getInvitationErrorTranslationKey({ error: data.error }),
        );
      } else {
        setErrorKey(getInvitationErrorTranslationKey({ error: data.error }));
        setPageState('invalid');
      }
    } catch {
      setErrorKey('auth.invitation.errors.acceptConnection');
      setPageState('error');
    } finally {
      setAccepting(false);
    }
  };

  if (pageState === 'loading' || authLoading) {
    return (
      <AuthExperience>
        <div className={authExperienceStyles.content}>
          <header className={authExperienceStyles.header}>
            <span className={authExperienceStyles.iconBadge}>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </span>
            <p className={authExperienceStyles.subtitle}>
              {t('auth.invitation.verifying')}
            </p>
          </header>
        </div>
      </AuthExperience>
    );
  }

  if (accepted) {
    return (
      <AuthExperience brand={authBrand}>
        <div className={authExperienceStyles.content}>
          <header className={authExperienceStyles.header}>
            <span className={authExperienceStyles.iconBadge}>
              {alreadyMember ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <PartyPopper className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <h1 className={authExperienceStyles.title}>
              {alreadyMember
                ? t('auth.invitation.alreadyMemberTitle')
                : t('auth.invitation.acceptedTitle')}
            </h1>
            <p className={authExperienceStyles.subtitle}>
              {alreadyMember
                ? t('auth.invitation.alreadyMemberDescriptionPrefix')
                : t('auth.invitation.acceptedDescriptionPrefix')}{' '}
              <strong>{organization?.name}</strong>
            </p>
          </header>
          <button
            type="button"
            onClick={() =>
              router.push(
                acceptedOrgSlug
                  ? `/${acceptedOrgSlug}/business-user/dashboard`
                  : '/',
              )
            }
            className={authExperienceStyles.primaryButton}
            style={{
              width: '100%',
              backgroundColor: primaryColor,
              color: 'var(--color-bg-light)',
            }}
          >
            {t('auth.invitation.goToDashboard')}
          </button>
        </div>
      </AuthExperience>
    );
  }

  if (pageState === 'invalid' || pageState === 'error') {
    const errorIcons: Record<string, ReactNode> = {
      expired: <Clock className="h-6 w-6" />,
      exhausted: <Users className="h-6 w-6" />,
      not_found: <XCircle className="h-6 w-6" />,
      paused: <AlertTriangle className="h-6 w-6" />,
      inactive: <AlertTriangle className="h-6 w-6" />,
    };

    return (
      <AuthExperience brand={authBrand}>
        <div className={authExperienceStyles.content}>
          <header className={authExperienceStyles.header}>
            <span className={authExperienceStyles.iconBadge}>
              {errorIcons[errorReason] || <XCircle className="h-6 w-6" />}
            </span>
            <h1 className={authExperienceStyles.title}>
              {t('auth.invitation.unavailableTitle')}
            </h1>
            <p className={authExperienceStyles.subtitle}>
              {t(errorKey || 'auth.invitation.errors.invalid')}
            </p>
          </header>
          <a href="/auth" className={authExperienceStyles.backLink}>
            {t('auth.invitation.goToLogin')}
          </a>
        </div>
      </AuthExperience>
    );
  }

  const dateLocaleByLanguage = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
  } as const;
  const expiresDate = invite?.expiresAt
    ? new Date(invite.expiresAt).toLocaleDateString(
        dateLocaleByLanguage[language],
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      )
    : null;

  return (
    <AuthExperience brand={authBrand}>
      <div className={authExperienceStyles.content}>
        <header className={authExperienceStyles.header}>
          <span className={authExperienceStyles.iconBadge}>
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className={authExperienceStyles.title}>{organization?.name}</h1>
          <p className={authExperienceStyles.subtitle}>
            {t('auth.invitation.organizationInviteDescription')}
          </p>
        </header>

        <div className={authExperienceStyles.details}>
          <div className={authExperienceStyles.detailsRow}>
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>{t('auth.invitation.valid')}</span>
          </div>

          <div className={authExperienceStyles.detailsRow}>
            <Shield className="h-5 w-5" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span>{t('auth.invitation.assignedRole')}</span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  roleColors[invite?.role || 'member']
                }`}
              >
                {t(getInvitationRoleTranslationKey(invite?.role))}
              </span>
            </div>
          </div>

          {invite?.remainingUses !== undefined && (
            <div className={authExperienceStyles.detailsRow}>
              <Users className="h-5 w-5" aria-hidden="true" />
              <span>
                {t('auth.invitation.remainingUses', {
                  count: invite.remainingUses,
                })}
              </span>
            </div>
          )}

          {expiresDate && (
            <div className={authExperienceStyles.detailsRow}>
              <Clock className="h-5 w-5" aria-hidden="true" />
              <span>
                {t('auth.invitation.validUntil', { date: expiresDate })}
              </span>
            </div>
          )}
        </div>

        <div className={authExperienceStyles.actions}>
          {actionErrorKey ? (
            <p className={authExperienceStyles.subtitle} role="alert">
              {t(actionErrorKey)}
            </p>
          ) : null}
          {user ? (
            <>
              <div className={authExperienceStyles.status}>
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border text-sm font-bold">
                  {user.first_name?.[0] ||
                    user.email?.[0]?.toUpperCase() ||
                    'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {user.display_name || user.email}
                  </p>
                  <p className="truncate text-xs">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAcceptInvite}
                disabled={accepting}
                className={authExperienceStyles.primaryButton}
                style={{
                  width: '100%',
                  backgroundColor: primaryColor,
                  color: 'var(--color-bg-light)',
                }}
              >
                {accepting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {accepting
                  ? t('auth.invitation.joining')
                  : t('auth.invitation.acceptAndJoin')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCreateAccount}
                className={authExperienceStyles.primaryButton}
                style={{
                  width: '100%',
                  backgroundColor: primaryColor,
                  color: 'var(--color-bg-light)',
                }}
              >
                <UserPlus className="h-5 w-5" />
                {t('auth.invitation.createAccountAndJoin')}
              </button>
              <button
                type="button"
                onClick={handleLogin}
                className={authExperienceStyles.secondaryButton}
                style={{ width: '100%' }}
              >
                <LogIn className="h-5 w-5" />
                {t('auth.invitation.alreadyHaveAccount')}
              </button>

              {organization &&
                (organization.googleLoginEnabled ||
                  organization.microsoftLoginEnabled) && (
                  <SocialLoginButtons
                    googleEnabled={organization.googleLoginEnabled}
                    microsoftEnabled={organization.microsoftLoginEnabled}
                    organizationSlug={organization.slug}
                    organizationId={organization.id}
                    bulkInviteToken={token}
                  />
                )}
            </>
          )}
        </div>

        <p className={authExperienceStyles.subtitle}>
          {t('auth.invitation.termsNotice')}
        </p>
      </div>
    </AuthExperience>
  );
}
