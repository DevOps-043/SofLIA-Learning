'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  UserPlus,
  LogIn,
  Shield,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons/SocialLoginButtons';
import { useLanguage } from '@/core/providers/I18nProvider';
import {
  getInvitationErrorTranslationKey,
  getInvitationRoleTranslationKey,
} from '@/features/auth/services/invitation-i18n.service';

// ============================================
// TYPES
// ============================================
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
  member: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  admin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  owner: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

// ============================================
// MAIN PAGE
// ============================================
export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const token = params?.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [errorKey, setErrorKey] = useState<string>('');
  const [errorReason, setErrorReason] = useState<string>('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptedOrgSlug, setAcceptedOrgSlug] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

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
        } else {
          setErrorKey(
            getInvitationErrorTranslationKey({
              error: data.error,
              reason: data.reason,
            }),
          );
          setErrorReason(data.reason || 'unknown');
          setPageState('invalid');
        }
      } catch {
        setErrorKey('auth.invitation.errors.verifyFailed');
        setPageState('error');
      }
    };

    validateToken();
  }, [token]);

  const primaryColor = organization?.primaryColor || '#14b8a6';

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
    try {
      // SECURITY: El servidor verifica la sesión activa por sí mismo.
      // Solo enviamos userId como dato informativo; el servidor lo valida
      // contra su propia sesión y rechaza si no coincide.
      const response = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        // Asegurar que las cookies de sesión se envíen al servidor
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (data.success) {
        setAccepted(true);
        setAcceptedOrgSlug(data.organizationSlug);
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

  // ——— LOADING ———
  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-gray-400 text-sm font-medium">
            {t('auth.invitation.verifying')}
          </p>
        </motion.div>
      </div>
    );
  }

  // ——— ACCEPTED SUCCESS ———
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#161b22] rounded-2xl border border-white/10 p-8 text-center"
        >
          <PartyPopper className="w-14 h-14 text-teal-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {t('auth.invitation.acceptedTitle')}
          </h1>
          <p className="text-gray-400 mb-6">
            {t('auth.invitation.acceptedDescriptionPrefix')}{' '}
            <strong className="text-white">{organization?.name}</strong>
          </p>
          <button
            onClick={() => router.push(acceptedOrgSlug ? `/${acceptedOrgSlug}/business-user/dashboard` : '/')}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            {t('auth.invitation.goToDashboard')}
          </button>
        </motion.div>
      </div>
    );
  }

  // ——— INVALID / ERROR ———
  if (pageState === 'invalid' || pageState === 'error') {
    const errorIcons: Record<string, React.ReactNode> = {
      expired: <Clock className="w-12 h-12 text-amber-400" />,
      exhausted: <Users className="w-12 h-12 text-red-400" />,
      not_found: <XCircle className="w-12 h-12 text-red-400" />,
      paused: <AlertTriangle className="w-12 h-12 text-amber-400" />,
      inactive: <AlertTriangle className="w-12 h-12 text-gray-400" />,
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#161b22] rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="mb-6">
            {errorIcons[errorReason] || <XCircle className="w-12 h-12 text-red-400 mx-auto" />}
          </div>
          <h1 className="text-xl font-bold text-white mb-3">
            {t('auth.invitation.unavailableTitle')}
          </h1>
          <p className="text-gray-400 mb-8">
            {t(errorKey || 'auth.invitation.errors.invalid')}
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-medium"
          >
            {t('auth.invitation.goToLogin')}
          </a>
        </motion.div>
      </div>
    );
  }

  // ——— VALID INVITATION ———
  const dateLocaleByLanguage = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
  } as const;
  const expiresDate = invite?.expiresAt
    ? new Date(invite.expiresAt).toLocaleDateString(dateLocaleByLanguage[language], {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0F1419] text-white flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${primaryColor}15, transparent)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-lg w-full"
      >
        {/* Card */}
        <div className="bg-[#161b22] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Top accent bar */}
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${organization?.accentColor || primaryColor}88)` }}
          />

          <div className="p-8 space-y-8">
            {/* Organization header */}
            <div className="text-center space-y-4">
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-16 h-16 rounded-2xl mx-auto object-contain bg-white/5 p-2"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Building2 className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-white">
                  {organization?.name}
                </h1>
                <p className="text-gray-400 mt-1">
                  {t('auth.invitation.organizationInviteDescription')}
                </p>
              </div>
            </div>

            {/* Invitation details */}
            <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">
                  {t('auth.invitation.valid')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">
                    {t('auth.invitation.assignedRole')}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleColors[invite?.role || 'member']}`}>
                    {t(getInvitationRoleTranslationKey(invite?.role))}
                  </span>
                </div>
              </div>

              {invite?.remainingUses !== undefined && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    {t('auth.invitation.remainingUses', {
                      count: invite.remainingUses,
                    })}
                  </span>
                </div>
              )}

              {expiresDate && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    {t('auth.invitation.validUntil', { date: expiresDate })}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {user ? (
                /* Logged-in user: accept directly */
                <>
                  <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                    <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{user.display_name || user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAcceptInvite}
                    disabled={accepting}
                    className="w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2.5 text-white shadow-lg disabled:opacity-50"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 24px ${primaryColor}30`,
                    }}
                  >
                    {accepting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {accepting
                      ? t('auth.invitation.joining')
                      : t('auth.invitation.acceptAndJoin')}
                  </button>
                </>
              ) : (
                /* Not logged in: show register + login buttons */
                <>
                  <button
                    onClick={handleCreateAccount}
                    className="w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2.5 group text-white shadow-lg"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 24px ${primaryColor}30`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    <UserPlus className="w-5 h-5" />
                    {t('auth.invitation.createAccountAndJoin')}
                  </button>

                  <button
                    onClick={handleLogin}
                    className="w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  >
                    <LogIn className="w-5 h-5 text-gray-400" />
                    {t('auth.invitation.alreadyHaveAccount')}
                  </button>

                  {/* Social login buttons */}
                  {organization && (organization.googleLoginEnabled || organization.microsoftLoginEnabled) && (
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

            {/* Footer */}
            <p className="text-center text-xs text-gray-500">
              {t('auth.invitation.termsNotice')}
            </p>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-gray-600 text-xs">
            <Sparkles className="w-3 h-3" />
            Powered by SofLIA
          </div>
        </div>
      </motion.div>
    </div>
  );
}
