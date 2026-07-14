import type { createClient } from '@/lib/supabase/server'
import type { logger as appLogger } from '@/lib/logger'
import { authFailure, authSuccess } from './result'
import { resolveOrganizationAccess } from './organization.service'
import {
  resolveAuthenticatedUserId,
  type CookieStoreLike,
  type SessionMessages,
} from './session.service'
import { loadAuthenticatedBusinessUser } from './user.service'
import type { BusinessAccessMode, BusinessAuth, AuthResult, OrganizationAccessOptions } from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type LoggerLike = Pick<typeof appLogger, 'auth' | 'debug' | 'warn' | 'error'>

const SESSION_MESSAGES_BY_MODE: Record<BusinessAccessMode, SessionMessages> = {
  'business-admin': {
    missingSession: 'No autenticado. Por favor, inicia sesión.',
    invalidSession: 'Sesión inválida. Por favor, inicia sesión nuevamente.',
    revokedSession: 'Sesión revocada. Por favor, inicia sesión nuevamente.',
    expiredSession: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  },
  'business-user': {
    missingSession: 'No autenticado. Por favor, inicia sesión.',
    invalidSession: 'Sesión inválida o expirada.',
    revokedSession: 'Sesión inválida o expirada.',
    expiredSession: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  },
}

const MODE_CONFIG = {
  'business-admin': {
    adminFallbackRole: 'admin',
    logPrefix: 'requireBusiness',
    successMessage: 'Business access granted',
  },
  'business-user': {
    adminFallbackRole: 'member',
    logPrefix: 'requireBusinessUser',
    successMessage: 'Business User access granted',
  },
} as const

export interface ResolveBusinessAccessDependencies {
  mode: BusinessAccessMode
  cookieStore: CookieStoreLike
  supabase: SupabaseClient
  logger: LoggerLike
  options?: OrganizationAccessOptions
}

export async function resolveBusinessAccess(
  dependencies: ResolveBusinessAccessDependencies,
): Promise<AuthResult<BusinessAuth>> {
  const { mode, cookieStore, supabase, logger, options } = dependencies
  const config = MODE_CONFIG[mode]

  const sessionResult = await resolveAuthenticatedUserId({
    cookieStore,
    supabase,
    logger,
    logPrefix: config.logPrefix,
    messages: SESSION_MESSAGES_BY_MODE[mode],
  })

  if (!sessionResult.ok) {
    return sessionResult
  }

  // Load the user row and resolve organization access concurrently: both only
  // need the authenticated userId (the user row id equals the session id), so
  // they don't depend on each other in the common case. We resolve the org
  // optimistically as a NON platform-admin; the only behavior that depends on
  // `isPlatformAdmin` is the rare "not a member" fallback, handled below.
  const userId = sessionResult.value
  const [userResult, optimisticOrgResult] = await Promise.all([
    loadAuthenticatedBusinessUser(supabase, userId, logger, mode),
    resolveOrganizationAccess({
      supabase,
      userId,
      isPlatformAdmin: false,
      options,
      adminFallbackRole: config.adminFallbackRole,
      logger,
    }),
  ])

  if (!userResult.ok) {
    return userResult
  }

  // Platform-admin fallback: if the optimistic (non-admin) resolution denied
  // access (403) but the user is actually a platform admin, re-resolve with
  // admin privileges. This preserves the exact original behavior while keeping
  // the fast path (members) down to a single round of parallel queries.
  let organizationResult = optimisticOrgResult
  if (
    !organizationResult.ok &&
    organizationResult.error.status === 403 &&
    userResult.value.isPlatformAdmin
  ) {
    organizationResult = await resolveOrganizationAccess({
      supabase,
      userId: userResult.value.id,
      isPlatformAdmin: true,
      options,
      adminFallbackRole: config.adminFallbackRole,
      logger,
    })
  }

  if (!organizationResult.ok) {
    return organizationResult
  }

  logger.auth(config.successMessage, {
    userId: userResult.value.id,
    email: userResult.value.email,
    role: userResult.value.platform_role,
    organizationId: organizationResult.value.organizationId,
    organizationSlug: organizationResult.value.organizationSlug,
    organizationRole: organizationResult.value.organizationRole,
    isOrgAdmin: organizationResult.value.isOrgAdmin,
  })

  return authSuccess({
    userId: userResult.value.id,
    userEmail: userResult.value.email ?? '',
    userRole: userResult.value.platform_role ?? '',
    organizationId: organizationResult.value.organizationId,
    organizationSlug: organizationResult.value.organizationSlug,
    organizationRole: organizationResult.value.organizationRole,
    isOrgAdmin: organizationResult.value.isOrgAdmin,
  })
}

export function createUnexpectedBusinessAuthFailure(): AuthResult<never> {
  return authFailure(500, 'Error interno del servidor.')
}
