import { logger } from '@/lib/logger'
import { recordSecurityEvent } from '@/lib/security/security-events'
import type { PromptRiskAction } from '@/lib/security/prompt-injection-detector.types'
import type { SessionUserRecord } from '@/features/auth/services/session.types'
import {
  authorizePlatformSuperadmin,
  type AdminReadGrant,
  type OrganizationAdminActionGrant,
} from '../superadmin/authorization'
import {
  buildOrganizationDossier,
  loadOrganizationCatalog,
  loadPlatformOrganizationIndex,
} from './admin-organization-lookup.service'
import { buildOrganizationLookupPromptSection as formatLookupPromptSection } from './admin-organization-lookup.prompt'
import {
  extractOrganizationIdentifiers,
  findMentionedOrganizations,
  mentionsOrganizationVocabulary,
} from './organization-mention-matching'
import type { OrganizationLookupResult } from './types'
import {
  MAX_AMBIGUOUS_ORGANIZATIONS,
  MAX_ORGANIZATION_DOSSIERS_PER_TURN,
} from './types'

/**
 * Consulta de organizaciones para SofLIA — punto de entrada del módulo.
 *
 * Dos alcances, un solo camino de datos:
 *
 *  - SUPERADMIN dentro de `/admin/*`: puede pedir el dossier de cualquier
 *    empresa. La organización se resuelve comparando el mensaje contra el
 *    catálogo real; si no nombra ninguna, recibe el índice de plataforma para
 *    poder responder preguntas comparativas.
 *  - OWNER/ADMIN de organización dentro de su business-panel: recibe SIEMPRE el
 *    dossier de SU empresa (el grant fija el tenant; no puede pedir otro).
 *
 * Fail-closed: sin grant válido devuelve cadena vacía y no se consulta nada.
 */

async function resolvePlatformLookup(
  grant: AdminReadGrant,
  recentUserMessages: string[],
): Promise<OrganizationLookupResult> {
  const catalog = await loadOrganizationCatalog(grant)
  const identifiers = extractOrganizationIdentifiers(recentUserMessages)
  const mentioned = findMentionedOrganizations(identifiers, catalog)

  if (mentioned.length > MAX_ORGANIZATION_DOSSIERS_PER_TURN) {
    return {
      scope: 'platform',
      dossiers: [],
      ambiguousCandidates: mentioned.slice(0, MAX_AMBIGUOUS_ORGANIZATIONS),
      searchedWithoutMatches: false,
      platformIndex: null,
      platformIndexTruncated: false,
    }
  }

  if (mentioned.length > 0) {
    const dossiers = await Promise.all(
      mentioned.map((entry) => buildOrganizationDossier(grant, entry.id)),
    )
    const resolved = dossiers.filter((dossier) => dossier !== null)

    return {
      scope: 'platform',
      dossiers: resolved,
      ambiguousCandidates: [],
      searchedWithoutMatches: resolved.length === 0,
      platformIndex: null,
      platformIndexTruncated: false,
    }
  }

  // No nombró ninguna organización. El índice permite responder "¿cuántas
  // empresas hay?" o "¿cuál tiene más usuarios?" sin inventar cifras, pero es la
  // consulta más cara del módulo: solo se construye si la pregunta va de
  // organizaciones. Para todo lo demás basta con las instrucciones de capacidad.
  if (!mentionsOrganizationVocabulary(recentUserMessages)) {
    return {
      scope: 'platform',
      dossiers: [],
      ambiguousCandidates: [],
      searchedWithoutMatches: false,
      platformIndex: null,
      platformIndexTruncated: false,
    }
  }

  const index = await loadPlatformOrganizationIndex(grant)
  return {
    scope: 'platform',
    dossiers: [],
    ambiguousCandidates: [],
    searchedWithoutMatches: false,
    platformIndex: index.entries,
    platformIndexTruncated: index.truncated,
  }
}

async function resolveOrganizationLookup(
  grant: OrganizationAdminActionGrant,
): Promise<OrganizationLookupResult> {
  const dossier = await buildOrganizationDossier(grant, grant.organizationId)

  return {
    scope: 'organization',
    dossiers: dossier ? [dossier] : [],
    ambiguousCandidates: [],
    searchedWithoutMatches: false,
    platformIndex: null,
    platformIndexTruncated: false,
  }
}

function auditLookup(params: {
  adminUserId: string
  scope: 'platform' | 'organization'
  organizationIds: string[]
}): void {
  if (params.organizationIds.length === 0) return

  recordSecurityEvent('admin-operation', {
    actorId: params.adminUserId,
    actorRole: params.scope === 'platform' ? 'administrador' : 'administrador-organizacion',
    resourceType: 'organization-dossier',
    metadata: {
      operation: 'lia-admin-organization-lookup',
      targetOrganizationIds: params.organizationIds,
    },
  })
}

export interface OrganizationLookupPromptParams {
  /** Usuario de la sesión del servidor (nunca del contexto del cliente). */
  sessionUser: SessionUserRecord
  /** Página actual reportada por el cliente; define la superficie permitida. */
  currentPage: string | null | undefined
  /** Acción del detector de inyección de prompt para el turno actual. */
  promptRiskAction: PromptRiskAction
  /** Mensajes del rol "user" en orden cronológico. */
  recentUserMessages: string[]
  /**
   * Grant organizacional ya emitido para este turno (owner/admin de la empresa,
   * o superadmin trabajando dentro del panel de un tenant). Si viene, el alcance
   * queda fijado a esa organización.
   */
  organizationGrant?: OrganizationAdminActionGrant | null
}

/**
 * Construye la sección del system prompt con la capacidad de consulta de
 * organizaciones y los datos que correspondan al alcance del actor.
 *
 * Fail-closed y sin excepciones: si la autorización no pasa devuelve '' (no se
 * inyecta NADA); ante un fallo interno devuelve solo las instrucciones de
 * capacidad, sin datos.
 */
export async function buildAdminOrganizationLookupPromptSection(
  params: OrganizationLookupPromptParams,
): Promise<string> {
  const grant =
    params.organizationGrant ??
    (await authorizePlatformSuperadmin({
      capability: 'organization-lookup',
      sessionUserId: params.sessionUser.id,
      sessionUserRole: params.sessionUser.platform_role,
      currentPage: params.currentPage,
      promptRiskAction: params.promptRiskAction,
    }))

  if (!grant) {
    return ''
  }

  const scope: 'platform' | 'organization' = params.organizationGrant
    ? 'organization'
    : 'platform'

  try {
    const result = params.organizationGrant
      ? await resolveOrganizationLookup(params.organizationGrant)
      : await resolvePlatformLookup(grant, params.recentUserMessages)

    auditLookup({
      adminUserId: grant.adminUserId,
      scope,
      organizationIds: result.dossiers.map((dossier) => dossier.profile.id),
    })

    return formatLookupPromptSection(result, scope)
  } catch (error) {
    logger.error('Consulta de organización: fallo al construir contexto', error)
    return formatLookupPromptSection(null, scope)
  }
}
