'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { OrganizationAuthLayout } from '@/features/auth/components/OrganizationAuth/OrganizationAuthLayout';
import { OrganizationRegisterForm } from '@/features/auth/components/OrganizationAuth/OrganizationRegisterForm';
import type { OrganizationAuthStyles } from '@/features/auth/components/OrganizationAuth/organization-auth.styles';
import { validateInvitationAction } from '@/features/auth/actions/invitation';
import { getExistingAccountInvitationLoginPath } from '@/features/auth/services/invitation-auth-routing.service';
import { getInvitationErrorTranslationKey } from '@/features/auth/services/invitation-i18n.service';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_font_family?: string | null;
  brand_favicon_url?: string | null;
  google_login_enabled?: boolean;
  microsoft_login_enabled?: boolean;
  login_styles?: OrganizationAuthStyles | null;
}

interface InvitationData {
  email: string;
  role: string;
}

interface BulkInviteData {
  token: string;
  role: string;
}

export default function OrganizationRegisterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const slug = params?.slug as string;
  const token = searchParams?.get('token'); // Individual invitation token
  const bulkToken = searchParams?.get('bulk_token'); // Bulk invite link token

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [bulkInvite, setBulkInvite] = useState<BulkInviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgErrorKey, setOrgErrorKey] = useState<string | null>(null);
  const [invitationErrorKey, setInvitationErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setOrgErrorKey('auth.org.errors.missingSlug');
      setIsLoading(false);
      return;
    }

    const fetchOrganizationAndValidateToken = async () => {
      try {
        setIsLoading(true);
        setOrgErrorKey(null);
        setInvitationErrorKey(null);

        // 1. Cargar información de la organización
        const response = await fetch(`/api/organizations/${slug}`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setOrgErrorKey('auth.org.errors.notFound');
          setIsLoading(false);
          return;
        }

        setOrganization(data.organization);

        // 2. Si hay bulk_token (enlace de invitación masiva), validarlo
        if (bulkToken) {
          const bulkResponse = await fetch(`/api/invite/${bulkToken}`);
          const bulkData = await bulkResponse.json();

          if (!bulkData.success || !bulkData.valid) {
            setInvitationErrorKey(
              getInvitationErrorTranslationKey({
                error: bulkData.error,
                reason: bulkData.reason,
              }),
            );
          } else if (bulkData.organization?.slug?.toLowerCase() !== slug.toLowerCase()) {
            setInvitationErrorKey('auth.invitation.errors.wrongOrganization');
          } else {
            // Bulk invite válida
            setBulkInvite({
              token: bulkToken,
              role: bulkData.invite?.role || 'member',
            });
          }
        }
        // 3. Si hay token de invitación individual, validarlo
        else if (token) {
          const validation = await validateInvitationAction(token);

          if (!validation.valid) {
            // Error de invitación - mostrar error pero continuar mostrando el formulario
            setInvitationErrorKey(
              getInvitationErrorTranslationKey({ error: validation.error }),
            );
          } else if (validation.organizationSlug?.toLowerCase() !== slug.toLowerCase()) {
            // La invitación es para otra organización
            setInvitationErrorKey('auth.invitation.errors.wrongOrganization');
          } else {
            const existingAccountLoginPath = getExistingAccountInvitationLoginPath({
              accountExists: validation.accountExists,
              organizationSlug: slug,
              token,
            });

            if (existingAccountLoginPath) {
              router.replace(existingAccountLoginPath);
              return;
            }

            // Invitación válida para una cuenta nueva - guardar datos
            setInvitation({
              email: validation.email!,
              role: validation.role!,
            });
          }
        }
      } catch (err) {
        setOrgErrorKey('auth.org.errors.loadFailed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationAndValidateToken();
  }, [slug, token, bulkToken, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
            />
          </div>
          <p className="text-white/60 text-sm font-medium">{t('actions.loading')}</p>
        </div>
      </div>
    );
  }

  // Error crítico de organización - no se puede continuar
  if (orgErrorKey || !organization) {
    const orgErrorMessage = t(orgErrorKey || 'auth.org.errors.notFound');

    return (
      <OrganizationAuthLayout
        organization={{
          id: '',
          name: 'Error',
          logo_url: '/icono.png',
        }}
        error={orgErrorMessage}
      >
        <div className="text-center space-y-4">
          <p className="text-text-secondary">
            {orgErrorMessage}
          </p>
          <Link
            href="/auth"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('auth.org.backToMainLogin')}
          </Link>
        </div>
      </OrganizationAuthLayout>
    );
  }

  const invitationErrorMessage = invitationErrorKey
    ? t(invitationErrorKey)
    : null;

  return (
    <OrganizationAuthLayout organization={organization} variant="registration">
      <div className="space-y-4">
        {/* Si hay error de invitación pero la organización existe, mostrar mensaje */}
        {invitationErrorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <div className="mt-0.5 rounded-lg bg-amber-500/15 p-1.5 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                {invitationErrorMessage}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-200/70">
                {t('auth.invitation.registerManualFallbackHint')}
              </p>
            </div>
          </div>
        )}

        <OrganizationRegisterForm
          organizationId={organization.id}
          organizationSlug={organization.slug || slug}
          invitationToken={invitationErrorKey ? undefined : token}
          invitedEmail={invitation?.email}
          invitedRole={invitation?.role || bulkInvite?.role}
          bulkInviteToken={invitationErrorKey ? undefined : bulkInvite?.token}
          googleLoginEnabled={organization.google_login_enabled}
          microsoftLoginEnabled={organization.microsoft_login_enabled}
        />
      </div>
    </OrganizationAuthLayout>
  );
}
