import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

import type {
  BusinessAccessStrategy,
  BusinessAuth,
  OrganizationMembershipRole,
  RequireBusinessOptions,
} from './requireBusiness.types';
import {
  buildBusinessAuth,
  createAuthErrorResponse,
  evaluateBusinessRoleAccess,
} from './requireBusiness.helpers';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AuthenticatedUserRow {
  id: string;
  email?: string | null;
  cargo_rol?: string | null;
}

interface LegacySessionRow {
  user_id: string;
  expires_at: string;
  revoked?: boolean | null;
}

interface RefreshTokenRow {
  user_id: string;
}

interface RequestedOrganizationRow {
  id: string;
  slug: string;
}

interface MembershipRow {
  role?: string | null;
}

interface LatestMembershipRow {
  organization_id: string;
  role?: string | null;
  organizations?: RequestedOrganizationRow | RequestedOrganizationRow[] | null;
}

interface ResolvedOrganizationAccess {
  organizationId?: string;
  organizationSlug?: string;
  organizationRole?: OrganizationMembershipRole;
}

function normalizeOrganizationRole(
  role: unknown,
  fallback: OrganizationMembershipRole
): OrganizationMembershipRole {
  if (role === 'owner' || role === 'admin' || role === 'member') {
    return role;
  }

  return fallback;
}

function extractOrganizationRecord(
  organization:
    | RequestedOrganizationRow
    | RequestedOrganizationRow[]
    | null
    | undefined
): RequestedOrganizationRow | null {
  if (!organization) {
    return null;
  }

  return Array.isArray(organization) ? organization[0] ?? null : organization;
}

async function resolveAuthenticatedUserId(
  supabase: SupabaseClient,
  strategy: BusinessAccessStrategy
): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (accessToken && refreshToken) {
    logger.debug(`${strategy.logPrefix}: Usando sistema de refresh tokens`);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const { data: token, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('user_id')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single<RefreshTokenRow>();

    if (!tokenError && token?.user_id) {
      logger.debug(`${strategy.logPrefix}: Sesión validada via refresh token`, {
        userId: token.user_id,
      });
      return token.user_id;
    }
  }

  const sessionCookie = cookieStore.get('aprende-y-aplica-session');

  if (!sessionCookie) {
    logger.warn('Business route accessed without any session');
    return createAuthErrorResponse(
      'No autenticado. Por favor, inicia sesión.',
      401
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from('user_session')
    .select('user_id, expires_at, revoked')
    .eq('jwt_id', sessionCookie.value)
    .single<LegacySessionRow>();

  if (sessionError || !session) {
    logger.warn('Invalid session token', { error: sessionError?.message });
    return createAuthErrorResponse(strategy.invalidLegacySessionMessage, 401);
  }

  if (session.revoked) {
    logger.warn('Attempted access with revoked session', {
      userId: session.user_id,
    });
    return createAuthErrorResponse(strategy.revokedSessionMessage, 401);
  }

  if (new Date() > new Date(session.expires_at)) {
    logger.warn('Attempted access with expired session', {
      userId: session.user_id,
      expiresAt: session.expires_at,
    });
    return createAuthErrorResponse(
      'Sesión expirada. Por favor, inicia sesión nuevamente.',
      401
    );
  }

  return session.user_id;
}

async function resolveAuthenticatedUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AuthenticatedUserRow | NextResponse> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, cargo_rol')
    .eq('id', userId)
    .single<AuthenticatedUserRow>();

  if (userError || !user) {
    logger.error('User not found for valid session', {
      userId,
      error: userError?.message,
    });
    return createAuthErrorResponse('Usuario no encontrado.', 401);
  }

  return user;
}

async function resolveOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  options: RequireBusinessOptions | undefined,
  isPlatformAdmin: boolean,
  strategy: BusinessAccessStrategy
): Promise<ResolvedOrganizationAccess | NextResponse> {
  if (options?.organizationId || options?.organizationSlug) {
    let orgQuery = supabase
      .from('organizations')
      .select('id, slug')
      .eq('is_active', true);

    if (options.organizationId) {
      orgQuery = orgQuery.eq('id', options.organizationId);
    } else if (options.organizationSlug) {
      orgQuery = orgQuery.eq('slug', options.organizationSlug);
    }

    const { data: requestedOrg, error: orgError } = await orgQuery.single<RequestedOrganizationRow>();

    if (orgError || !requestedOrg) {
      logger.warn('Requested organization not found', {
        organizationId: options.organizationId,
        organizationSlug: options.organizationSlug,
      });
      return createAuthErrorResponse('Organización no encontrada.', 404);
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', requestedOrg.id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single<MembershipRow>();

    if (membershipError || !membership) {
      if (isPlatformAdmin) {
        logger.auth('Platform admin accessing organization (not a member)', {
          userId,
          organizationId: requestedOrg.id,
        });
        return {
          organizationId: requestedOrg.id,
          organizationSlug: requestedOrg.slug,
          organizationRole: strategy.fallbackRoleForPlatformAdmin,
        };
      }

      logger.warn('User not member of requested organization', {
        userId,
        organizationId: requestedOrg.id,
        organizationSlug: requestedOrg.slug,
      });

      return createAuthErrorResponse(
        'No tienes acceso a esta organización.',
        403
      );
    }

    return {
      organizationId: requestedOrg.id,
      organizationSlug: requestedOrg.slug,
      organizationRole: normalizeOrganizationRole(
        membership.role,
        strategy.fallbackRoleForPlatformAdmin
      ),
    };
  }

  const { data: userOrgs } = await supabase
    .from('organization_users')
    .select(`
      organization_id,
      role,
      joined_at,
      organizations!inner (
        id,
        slug,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('organizations.is_active', true)
    .order('joined_at', { ascending: false })
    .limit(1);

  const latestMembership = userOrgs?.[0] as LatestMembershipRow | undefined;
  const organization = extractOrganizationRecord(latestMembership?.organizations);

  if (!latestMembership) {
    return {};
  }

  return {
    organizationId: latestMembership.organization_id,
    organizationSlug: organization?.slug,
    organizationRole: normalizeOrganizationRole(
      latestMembership.role,
      strategy.fallbackRoleForPlatformAdmin
    ),
  };
}

export async function requireBusinessAccess(
  options: RequireBusinessOptions | undefined,
  strategy: BusinessAccessStrategy
): Promise<BusinessAuth | NextResponse> {
  try {
    const supabase = await createClient();
    const resolvedUserId = await resolveAuthenticatedUserId(supabase, strategy);

    if (resolvedUserId instanceof NextResponse) {
      return resolvedUserId;
    }

    const user = await resolveAuthenticatedUser(supabase, resolvedUserId);

    if (user instanceof NextResponse) {
      return user;
    }

    const access = evaluateBusinessRoleAccess(user.cargo_rol);

    if (!access.isAllowed) {
      logger.warn(strategy.invalidRoleLogMessage, {
        userId: user.id,
        email: user.email,
        role: user.cargo_rol,
        normalizedRole: access.normalizedRole,
      });

      return createAuthErrorResponse(
        `Permisos insuficientes. Se requiere rol de Business o Administrador. Rol actual: ${user.cargo_rol || 'sin rol'}`,
        403
      );
    }

    const organization = await resolveOrganizationAccess(
      supabase,
      user.id,
      options,
      access.isPlatformAdmin,
      strategy
    );

    if (organization instanceof NextResponse) {
      return organization;
    }

    const auth = buildBusinessAuth(user, organization);

    logger.auth(strategy.successLogMessage, {
      userId: auth.userId,
      email: auth.userEmail,
      role: auth.userRole,
      organizationId: auth.organizationId,
      organizationSlug: auth.organizationSlug,
      organizationRole: auth.organizationRole,
      isOrgAdmin: auth.isOrgAdmin,
    });

    return auth;
  } catch (error) {
    logger.error(
      strategy.errorLogMessage,
      error instanceof Error ? error : undefined
    );

    return createAuthErrorResponse('Error interno del servidor.', 500);
  }
}
