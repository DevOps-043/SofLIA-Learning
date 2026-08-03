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
  buildCourseDossier,
  buildLearningPathDossier,
  loadContentCatalog,
  loadContentIndex,
} from './admin-content-lookup.service'
import { buildContentLookupPromptSection as formatLookupPromptSection } from './admin-content-lookup.prompt'
import {
  countMentionedContent,
  extractContentIdentifiers,
  findMentionedContent,
  mentionsContentVocabulary,
} from './content-mention-matching'
import type { ContentCandidate, ContentLookupResult } from './types'
import { MAX_AMBIGUOUS_CONTENT, MAX_CONTENT_DOSSIERS_PER_TURN } from './types'

/**
 * Consulta de cursos y rutas para SofLIA — punto de entrada del módulo.
 *
 * Un solo camino de datos con dos alcances, igual que el módulo de
 * organizaciones:
 *
 *  - SUPERADMIN dentro de `/admin/*`: cualquier curso o ruta, con cifras de toda
 *    la plataforma. Si no nombra ninguno pero pregunta por el catálogo, recibe
 *    el índice general.
 *  - OWNER/ADMIN de organización en su business-panel: solo el contenido que su
 *    empresa tiene asignado, y siempre con las cifras de su empresa.
 *
 * Fail-closed: sin grant válido devuelve cadena vacía y no se consulta nada.
 */

/** Resultado vacío del alcance dado. Función, no constante: cada llamada
 * devuelve arrays propios y nadie puede mutar el estado de otro turno. */
function emptyResult(scope: 'platform' | 'organization'): ContentLookupResult {
  return {
    scope,
    courseDossiers: [],
    learningPathDossiers: [],
    ambiguousCandidates: [],
    searchedWithoutMatches: false,
    catalogIndex: null,
  }
}

async function resolveContentLookup(
  grant: AdminReadGrant,
  recentUserMessages: string[],
  scope: 'platform' | 'organization',
): Promise<ContentLookupResult> {
  const catalog = await loadContentCatalog(grant)
  const identifiers = extractContentIdentifiers(recentUserMessages)
  const mentioned = findMentionedContent(identifiers, catalog)
  const mentionedCount = countMentionedContent(mentioned)

  if (mentionedCount > MAX_CONTENT_DOSSIERS_PER_TURN) {
    const candidates: ContentCandidate[] = [
      ...mentioned.courses.map((entry) => ({
        kind: 'course' as const,
        title: entry.title,
        slug: entry.slug,
      })),
      ...mentioned.learningPaths.map((entry) => ({
        kind: 'learning-path' as const,
        title: entry.title,
        slug: entry.slug,
      })),
    ]

    return {
      ...emptyResult(scope),
      ambiguousCandidates: candidates.slice(0, MAX_AMBIGUOUS_CONTENT),
    }
  }

  if (mentionedCount > 0) {
    const [courseDossiers, learningPathDossiers] = await Promise.all([
      Promise.all(mentioned.courses.map((entry) => buildCourseDossier(grant, entry.id))),
      Promise.all(
        mentioned.learningPaths.map((entry) =>
          buildLearningPathDossier(grant, entry.id),
        ),
      ),
    ])

    const resolvedCourses = courseDossiers.filter((dossier) => dossier !== null)
    const resolvedPaths = learningPathDossiers.filter((dossier) => dossier !== null)

    return {
      ...emptyResult(scope),
      courseDossiers: resolvedCourses,
      learningPathDossiers: resolvedPaths,
      searchedWithoutMatches:
        resolvedCourses.length === 0 && resolvedPaths.length === 0,
    }
  }

  // No nombró contenido concreto. El índice del catálogo solo existe para el
  // superadmin (el administrador de organización ya recibe la adopción de sus
  // cursos en el dossier de su empresa) y solo si la pregunta va de contenido:
  // es la consulta más cara del módulo.
  if (scope === 'organization' || !mentionsContentVocabulary(recentUserMessages)) {
    return emptyResult(scope)
  }

  return {
    ...emptyResult(scope),
    catalogIndex: await loadContentIndex(grant),
  }
}

function auditLookup(params: {
  adminUserId: string
  scope: 'platform' | 'organization'
  result: ContentLookupResult
}): void {
  const courseIds = params.result.courseDossiers.map((dossier) => dossier.profile.id)
  if (courseIds.length === 0) return

  recordSecurityEvent('admin-operation', {
    actorId: params.adminUserId,
    actorRole:
      params.scope === 'platform' ? 'administrador' : 'administrador-organizacion',
    resourceType: 'course-dossier',
    metadata: {
      operation: 'lia-admin-content-lookup',
      scope: params.scope,
      targetCourseIds: courseIds,
    },
  })
}

export interface ContentLookupPromptParams {
  /** Usuario de la sesión del servidor (nunca del contexto del cliente). */
  sessionUser: SessionUserRecord
  /** Página actual reportada por el cliente; define la superficie permitida. */
  currentPage: string | null | undefined
  /** Acción del detector de inyección de prompt para el turno actual. */
  promptRiskAction: PromptRiskAction
  /** Mensajes del rol "user" en orden cronológico. */
  recentUserMessages: string[]
  /**
   * Grant organizacional ya emitido para este turno. Si viene, el alcance queda
   * fijado al contenido y las cifras de esa organización.
   */
  organizationGrant?: OrganizationAdminActionGrant | null
}

/**
 * Construye la sección del system prompt con la capacidad de consulta de
 * contenido y los datos que correspondan al alcance del actor.
 *
 * Fail-closed y sin excepciones: si la autorización no pasa devuelve '' (no se
 * inyecta NADA); ante un fallo interno devuelve solo las instrucciones de
 * capacidad, sin datos.
 */
export async function buildAdminContentLookupPromptSection(
  params: ContentLookupPromptParams,
): Promise<string> {
  const grant =
    params.organizationGrant ??
    (await authorizePlatformSuperadmin({
      capability: 'content-lookup',
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
    const result = await resolveContentLookup(grant, params.recentUserMessages, scope)
    auditLookup({ adminUserId: grant.adminUserId, scope, result })
    return formatLookupPromptSection(result, scope)
  } catch (error) {
    logger.error('Consulta de contenido: fallo al construir contexto', error)
    return formatLookupPromptSection(null, scope)
  }
}
