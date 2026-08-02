import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { isPlatformAdminRole, PLATFORM_ADMIN_ROLE } from '@/lib/auth/platform-role'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit.check'
import { RateLimitTier } from '@/lib/rate-limit/rate-limit.types'
import type { PromptRiskAction } from '@/lib/security/prompt-injection-detector.types'

/**
 * Autorización del copiloto de SofLIA para superadmins.
 *
 * Emite el `PlatformSuperadminGrant` que exigen TODAS las capacidades
 * privilegiadas del chat (consulta global de usuarios y ejecución de acciones
 * administrativas). Un único punto de decisión para no tener criterios
 * divergentes entre capacidades.
 *
 * Candados (todos fail-closed — cualquier fallo niega el acceso):
 *  1. ROL DE SESIÓN: la sesión del servidor debe ser Admin de plataforma.
 *  2. CANDADO DE PANEL: la página actual debe pertenecer al panel de
 *     superadmin (`/admin/*`). Nunca desde business-panel, business-user ni
 *     ninguna otra superficie.
 *  3. CANDADO DE RIESGO: si el detector de inyección marcó el turno
 *     (action !== 'allow'), no se concede nada.
 *  4. RATE LIMIT: por admin y por capacidad (tier ADMIN).
 *  5. RE-VERIFICACIÓN EN BD: el rol y el estado de baneo se releen de `users`
 *     en el momento de la operación (ignora cachés de sesión; cubre revocación
 *     de rol o baneo posteriores al login).
 *
 * El grant no es falsificable: la clase no se exporta, por lo que la única
 * forma de obtener una instancia es `authorizePlatformSuperadmin`.
 */

/** Prefijo de rutas del panel de superadmin. Única superficie permitida. */
export const SUPERADMIN_PANEL_PATH_PREFIX = '/admin'

/**
 * Capacidades privilegiadas del copiloto. Cada una tiene su propio cubo de
 * rate limit para que el uso de una no agote a la otra.
 */
export type SuperadminCapability = 'user-lookup' | 'admin-actions'

class SuperadminGrant {
  readonly adminUserId: string
  readonly capability: SuperadminCapability

  constructor(adminUserId: string, capability: SuperadminCapability) {
    this.adminUserId = adminUserId
    this.capability = capability
  }
}

export type PlatformSuperadminGrant = SuperadminGrant

class OrganizationAdminGrant {
  readonly adminUserId: string
  readonly capability = 'admin-actions' as const
  readonly organizationId: string
  readonly organizationSlug: string
  readonly actorAuthority: 'platform-superadmin' | 'organization-admin'
  readonly organizationRole: 'owner' | 'admin' | null

  constructor(params: {
    adminUserId: string
    organizationId: string
    organizationSlug: string
    actorAuthority: 'platform-superadmin' | 'organization-admin'
    organizationRole: 'owner' | 'admin' | null
  }) {
    const {
      adminUserId,
      organizationId,
      organizationSlug,
      actorAuthority,
      organizationRole,
    } = params
    this.adminUserId = adminUserId
    this.organizationId = organizationId
    this.organizationSlug = organizationSlug
    this.actorAuthority = actorAuthority
    this.organizationRole = organizationRole
  }
}

export type OrganizationAdminActionGrant = OrganizationAdminGrant
export type AdminActionGrant = PlatformSuperadminGrant | OrganizationAdminActionGrant

/**
 * Guard de runtime: rechaza cualquier objeto que no haya sido emitido por
 * `authorizePlatformSuperadmin` (un cast de TypeScript no basta para eludirlo).
 */
export function assertPlatformSuperadminGrant(
  grant: unknown,
  expectedCapability: SuperadminCapability,
): asserts grant is PlatformSuperadminGrant {
  const isValid =
    grant instanceof SuperadminGrant && grant.capability === expectedCapability

  if (!isValid) {
    recordSecurityEvent('access-denied', {
      resourceType: 'superadmin-copilot',
      reasons: [`soflia-superadmin:invalid-grant:${expectedCapability}`],
    })
    throw new Error(
      `SofLIA superadmin: acceso a "${expectedCapability}" sin grant de autorización válido`,
    )
  }
}

export function isOrganizationAdminActionGrant(
  grant: AdminActionGrant,
): grant is OrganizationAdminActionGrant {
  return grant instanceof OrganizationAdminGrant
}

/** Guard común para el motor de acciones (superadmin u org admin). */
export function assertAdminActionGrant(
  grant: unknown,
): asserts grant is AdminActionGrant {
  const isValid =
    (grant instanceof SuperadminGrant && grant.capability === 'admin-actions') ||
    grant instanceof OrganizationAdminGrant

  if (!isValid) {
    recordSecurityEvent('access-denied', {
      resourceType: 'admin-copilot',
      reasons: ['soflia-admin:invalid-action-grant'],
    })
    throw new Error('SofLIA: acceso a acciones sin grant válido')
  }
}

/**
 * Determina si la página actual pertenece al panel de superadmin.
 * Estricta: solo `/admin` exacto o `/admin/...` (query y hash se ignoran).
 */
export function isSuperadminPanelPage(currentPage: string | null | undefined): boolean {
  if (typeof currentPage !== 'string' || !currentPage.trim()) return false
  const path = currentPage.split(/[?#]/)[0].trim()
  return (
    path === SUPERADMIN_PANEL_PATH_PREFIX ||
    path.startsWith(`${SUPERADMIN_PANEL_PATH_PREFIX}/`)
  )
}

export function isOrganizationAdminPanelPage(
  currentPage: string | null | undefined,
  organizationSlug: string,
): boolean {
  if (typeof currentPage !== 'string' || !currentPage.trim()) return false
  const path = currentPage.split(/[?#]/)[0].trim()
  const prefix = `/${organizationSlug}/business-panel`
  return path === prefix || path.startsWith(`${prefix}/`)
}

async function verifyActiveOrganizationScope(
  organizationId: string,
  organizationSlug: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .eq('slug', organizationSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    logger.warn('SofLIA acciones: organización inactiva o contexto ID/slug inválido', {
      organizationId,
      organizationSlug,
      error: error?.message,
    })
    return false
  }

  return true
}

/**
 * Re-verifica rol y baneo contra la base de datos en el momento de la
 * operación. Fail-closed: cualquier error de lectura niega el acceso.
 */
async function verifyAdminRoleInDatabase(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('platform_role, is_banned')
    .eq('id', userId)
    .single()

  if (error || !data) {
    logger.warn('SofLIA superadmin: no se pudo re-verificar el rol en BD', {
      error: error?.message,
    })
    return false
  }

  return data.is_banned !== true && isPlatformAdminRole(data.platform_role)
}

export interface AuthorizeSuperadminParams {
  /** Capacidad solicitada (define el grant emitido y el cubo de rate limit). */
  capability: SuperadminCapability
  /** Id del usuario de la sesión del servidor (nunca del cliente). */
  sessionUserId: string
  /** `platform_role` del usuario de la sesión del servidor. */
  sessionUserRole: string | null
  /** Página actual reportada por el cliente (candado de superficie). */
  currentPage: string | null | undefined
  /** Acción del detector de inyección de prompt para el turno actual. */
  promptRiskAction: PromptRiskAction
}

/**
 * Ejecuta todos los candados y emite el grant solo si TODOS pasan.
 * Devuelve `null` en cualquier otro caso (fail-closed, no lanza).
 */
export async function authorizePlatformSuperadmin(
  params: AuthorizeSuperadminParams,
): Promise<PlatformSuperadminGrant | null> {
  const { capability, sessionUserId, sessionUserRole, currentPage, promptRiskAction } =
    params

  // Candado 1: rol de la sesión del servidor.
  if (!sessionUserId || !isPlatformAdminRole(sessionUserRole)) {
    return null
  }

  // Candado 2: superficie permitida — solo el panel de superadmin.
  if (!isSuperadminPanelPage(currentPage)) {
    return null
  }

  // Candado 3: el turno no debe estar marcado como sospechoso.
  if (promptRiskAction !== 'allow') {
    logger.warn('SofLIA superadmin: turno con riesgo de inyección, capacidad denegada', {
      capability,
      promptRiskAction,
    })
    return null
  }

  // Candado 4: rate limit por admin y capacidad.
  const rateLimit = checkRateLimit(
    `soflia-superadmin:${capability}:${sessionUserId}`,
    RateLimitTier.ADMIN,
  )
  if (!rateLimit.allowed) {
    recordSecurityEvent('rate-limit-triggered', {
      actorId: sessionUserId,
      resourceType: 'superadmin-copilot',
      reasons: [`soflia-superadmin:rate-limited:${capability}`],
    })
    return null
  }

  // Candado 5: re-verificación en BD (última, por ser la más costosa).
  const isAdminInDatabase = await verifyAdminRoleInDatabase(sessionUserId)
  if (!isAdminInDatabase) {
    // La sesión afirma Admin pero la BD lo niega: sesión obsoleta, rol revocado,
    // usuario baneado o manipulación. Se audita como acceso denegado.
    recordSecurityEvent('access-denied', {
      actorId: sessionUserId,
      resourceType: 'superadmin-copilot',
      reasons: [`soflia-superadmin:session-db-role-mismatch:${capability}`],
    })
    return null
  }

  return new SuperadminGrant(sessionUserId, capability)
}

export interface AuthorizeOrganizationAdminParams {
  sessionUserId: string
  currentPage: string | null | undefined
  promptRiskAction: PromptRiskAction
  organizationId: string
  organizationSlug: string
}

export interface AuthorizePlatformAdminOrganizationParams
  extends AuthorizeOrganizationAdminParams {
  sessionUserRole: string | null
}

/**
 * Emite un grant ORGANIZACIONAL para un superadmin que está trabajando desde
 * el business-panel de un tenant. Mantener el grant ligado a la organización
 * evita que su rol global convierta una orden contextual en una acción fuera
 * de la organización visible.
 */
export async function authorizePlatformSuperadminOrganizationActions(
  params: AuthorizePlatformAdminOrganizationParams,
): Promise<OrganizationAdminActionGrant | null> {
  if (
    !params.sessionUserId ||
    !params.organizationId ||
    !params.organizationSlug ||
    !isPlatformAdminRole(params.sessionUserRole) ||
    params.promptRiskAction !== 'allow' ||
    !isOrganizationAdminPanelPage(params.currentPage, params.organizationSlug)
  ) {
    return null
  }

  const rateLimit = checkRateLimit(
    `soflia-platform-admin:organization-actions:${params.organizationId}:${params.sessionUserId}`,
    RateLimitTier.ADMIN,
  )
  if (!rateLimit.allowed) {
    recordSecurityEvent('rate-limit-triggered', {
      actorId: params.sessionUserId,
      resourceType: 'organization-admin-copilot',
      reasons: ['soflia-platform-admin:organization-actions:rate-limited'],
      metadata: { organizationId: params.organizationId },
    })
    return null
  }

  const [isVerifiedAdmin, isVerifiedOrganization] = await Promise.all([
    verifyAdminRoleInDatabase(params.sessionUserId),
    verifyActiveOrganizationScope(params.organizationId, params.organizationSlug),
  ])
  if (!isVerifiedAdmin || !isVerifiedOrganization) {
    recordSecurityEvent('access-denied', {
      actorId: params.sessionUserId,
      resourceType: 'organization-admin-copilot',
      reasons: ['soflia-platform-admin:organization-scope-role-reverification-failed'],
      metadata: { organizationId: params.organizationId },
    })
    return null
  }

  return new OrganizationAdminGrant({
    adminUserId: params.sessionUserId,
    organizationId: params.organizationId,
    organizationSlug: params.organizationSlug,
    actorAuthority: 'platform-superadmin',
    organizationRole: null,
  })
}

/**
 * Autoriza acciones para owner/admin de una organización concreta. El grant
 * queda ligado a ese tenant y no puede reutilizarse tras navegar a otro.
 */
export async function authorizeOrganizationAdminActions(
  params: AuthorizeOrganizationAdminParams,
): Promise<OrganizationAdminActionGrant | null> {
  if (
    !params.sessionUserId ||
    !params.organizationId ||
    !params.organizationSlug ||
    params.promptRiskAction !== 'allow' ||
    !isOrganizationAdminPanelPage(params.currentPage, params.organizationSlug)
  ) {
    return null
  }

  const rateLimit = checkRateLimit(
    `soflia-org-admin:admin-actions:${params.organizationId}:${params.sessionUserId}`,
    RateLimitTier.ADMIN,
  )
  if (!rateLimit.allowed) {
    recordSecurityEvent('rate-limit-triggered', {
      actorId: params.sessionUserId,
      resourceType: 'organization-admin-copilot',
      reasons: ['soflia-org-admin:admin-actions:rate-limited'],
      metadata: { organizationId: params.organizationId },
    })
    return null
  }

  const supabase = createAdminClient()
  const [
    { data: user, error: userError },
    { data: membership, error: membershipError },
    isVerifiedOrganization,
  ] =
    await Promise.all([
      supabase
        .from('users')
        .select('is_banned')
        .eq('id', params.sessionUserId)
        .single(),
      supabase
        .from('organization_users')
        .select('role, status')
        .eq('organization_id', params.organizationId)
        .eq('user_id', params.sessionUserId)
        .single(),
      verifyActiveOrganizationScope(params.organizationId, params.organizationSlug),
    ])

  const role = typeof membership?.role === 'string'
    ? membership.role.toLowerCase().trim()
    : ''
  const status = typeof membership?.status === 'string'
    ? membership.status.toLowerCase().trim()
    : ''
  const authorized =
    !userError &&
    !membershipError &&
    Boolean(user) &&
    Boolean(membership) &&
    isVerifiedOrganization &&
    user?.is_banned !== true &&
    status === 'active' &&
    (role === 'owner' || role === 'admin')

  if (!authorized) {
    recordSecurityEvent('access-denied', {
      actorId: params.sessionUserId,
      resourceType: 'organization-admin-copilot',
      reasons: ['soflia-org-admin:membership-reverification-failed'],
      metadata: { organizationId: params.organizationId },
    })
    return null
  }

  return new OrganizationAdminGrant({
    adminUserId: params.sessionUserId,
    organizationId: params.organizationId,
    organizationSlug: params.organizationSlug,
    actorAuthority: 'organization-admin',
    organizationRole: role as 'owner' | 'admin',
  })
}

export { isPlatformAdminRole, PLATFORM_ADMIN_ROLE }
