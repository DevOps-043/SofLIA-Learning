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

export { isPlatformAdminRole, PLATFORM_ADMIN_ROLE }
