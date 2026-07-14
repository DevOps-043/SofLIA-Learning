import { logger } from '@/lib/logger'
import { recordSecurityEvent } from '@/lib/security/security-events'
import type { PromptRiskAction } from '@/lib/security/prompt-injection-detector.types'
import type { SessionUserRecord } from '@/features/auth/services/session.types'
import {
  authorizePlatformSuperadmin,
  type PlatformSuperadminGrant,
} from '../superadmin/authorization'
import {
  extractLookupIdentifiers,
  hasAnyIdentifier,
} from './identifier-extraction'
import {
  buildAdminUserDossier,
  searchUsersByIdentifiers,
} from './admin-user-lookup.service'
import { buildAdminLookupPromptSection } from './admin-user-lookup.prompt'
import type { AdminUserLookupResult } from './types'
import { MAX_AMBIGUOUS_CANDIDATES, MAX_DOSSIERS_PER_TURN } from './types'

/**
 * Consulta global de usuarios para SofLIA — punto de entrada del módulo.
 *
 * Capacidad exclusiva del superadmin de plataforma dentro del panel `/admin/*`.
 * La autorización completa vive en `../superadmin/authorization` y es
 * fail-closed: si algún candado no pasa, esta función devuelve cadena vacía y
 * NO se consulta ningún dato.
 */

/**
 * Decide qué hacer con las coincidencias encontradas:
 *
 *  - 0 coincidencias        → se informa que no existe.
 *  - 1 coincidencia         → dossier completo, aunque se haya buscado por
 *                             nombre: si solo hay una "María Domenzain", pedir
 *                             el correo sería absurdo.
 *  - varias por NOMBRE      → se pregunta cuál, mostrando su organización.
 *  - varias por IDENTIFICADOR (el admin dio varios emails/ids) → dossier de
 *                             cada una, hasta el máximo por turno.
 */
async function resolveLookupResult(
  grant: PlatformSuperadminGrant,
  recentUserMessages: string[],
): Promise<AdminUserLookupResult | null> {
  const identifiers = extractLookupIdentifiers(recentUserMessages)
  if (!hasAnyIdentifier(identifiers)) {
    return null
  }

  const { candidates, matchedBy } = await searchUsersByIdentifiers(
    grant,
    identifiers,
  )

  if (candidates.length === 0) {
    return { dossiers: [], ambiguousCandidates: [], searchedWithoutMatches: true }
  }

  const isAmbiguous =
    candidates.length > 1 &&
    (matchedBy === 'name' || candidates.length > MAX_DOSSIERS_PER_TURN)

  if (isAmbiguous) {
    return {
      dossiers: [],
      ambiguousCandidates: candidates.slice(0, MAX_AMBIGUOUS_CANDIDATES),
      searchedWithoutMatches: false,
    }
  }

  const dossiers = await Promise.all(
    candidates.map((candidate) => buildAdminUserDossier(grant, candidate.profile)),
  )
  return { dossiers, ambiguousCandidates: [], searchedWithoutMatches: false }
}

export interface AdminUserLookupPromptParams {
  /** Usuario de la sesión del servidor (nunca del contexto del cliente). */
  sessionUser: SessionUserRecord
  /** Página actual reportada por el cliente; solo `/admin/*` habilita la capacidad. */
  currentPage: string | null | undefined
  /** Acción del detector de inyección de prompt para el turno actual. */
  promptRiskAction: PromptRiskAction
  /** Mensajes del rol "user" en orden cronológico. */
  recentUserMessages: string[]
}

/**
 * Construye la sección del system prompt con la capacidad de consulta global y,
 * si el mensaje contiene identificadores de usuario, el dossier consultado.
 *
 * Fail-closed y sin excepciones: si la autorización no pasa devuelve '' (no se
 * inyecta NADA); ante un fallo interno devuelve solo las instrucciones de
 * capacidad, sin datos.
 */
export async function buildAdminUserLookupPromptSection(
  params: AdminUserLookupPromptParams,
): Promise<string> {
  const grant = await authorizePlatformSuperadmin({
    capability: 'user-lookup',
    sessionUserId: params.sessionUser.id,
    sessionUserRole: params.sessionUser.platform_role,
    currentPage: params.currentPage,
    promptRiskAction: params.promptRiskAction,
  })

  if (!grant) {
    return ''
  }

  try {
    const result = await resolveLookupResult(grant, params.recentUserMessages)

    if (result && result.dossiers.length > 0) {
      // Auditoría: acceso administrativo a datos completos de usuarios vía SofLIA.
      recordSecurityEvent('admin-operation', {
        actorId: grant.adminUserId,
        actorRole: 'administrador',
        resourceType: 'user-dossier',
        metadata: {
          operation: 'lia-admin-user-lookup',
          targetUserIds: result.dossiers.map((dossier) => dossier.profile.id),
        },
      })
    }

    return buildAdminLookupPromptSection(result)
  } catch (error) {
    logger.error('Admin user lookup: fallo al construir contexto', error)
    return buildAdminLookupPromptSection(null)
  }
}
