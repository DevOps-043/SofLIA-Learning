import { resolveCourseOrganizationScope } from '@/features/courses/services/course-enrollment.server.service'
import { isPlatformAdminRole } from '@/lib/auth/platform-role'
import { resolveUserPrimaryMembership } from '@/lib/services/user-org-context.service'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

/**
 * UUID nulo: nunca corresponde a una organización real, por lo que cualquier
 * comparación contra él devuelve cero filas.
 */
const EMPTY_SCOPE_SENTINEL = '00000000-0000-0000-0000-000000000000'

/** Datos mínimos del usuario que necesita el alcance; evita acoplar a SessionUserRecord. */
interface ScopeUser {
  id: string
  platform_role: string | null
}

/**
 * Alcance organizacional de las preguntas de comunidad de un curso.
 *
 * Las preguntas y respuestas son una conversación **interna de cada empresa**:
 * un empleado sólo puede ver e interactuar con las preguntas creadas por
 * usuarios de su misma organización, aunque el curso sea compartido entre
 * varias organizaciones.
 *
 * El superadmin de plataforma queda fuera del límite por soporte y moderación.
 */
export interface QuestionsOrgScope {
  isPlatformAdmin: boolean
  organizationId: string | null
}

/** Fila mínima necesaria para decidir visibilidad de una pregunta. */
export interface OrgScopedQuestionRow {
  organization_id?: string | null
}

/**
 * Resuelve el alcance organizacional del usuario actual **para un curso**.
 *
 * El ámbito sale de la inscripción del usuario en ese curso, no de una
 * organización "principal" suya: quien pertenece a dos empresas debe leer y
 * publicar en la que le dio acceso a ESTE curso. Usar la membresía principal
 * hacía que sus preguntas se sellaran con la otra empresa —visibles para quien
 * no comparte el curso e invisibles para quien sí— y que ese alcance cambiara
 * solo con entrar en una organización nueva.
 *
 * La inscripción es dato del servidor, así que el alcance sigue sin depender de
 * ningún parámetro del cliente. `requestedOrganizationId` únicamente desempata
 * entre inscripciones que el usuario ya tiene (ver
 * `resolveAnyScopeCourseEnrollment`).
 *
 * Un usuario sin sesión, sin inscripción y sin membresía activa obtiene un
 * alcance vacío (`organizationId: null`), que no ve ninguna pregunta:
 * preferimos negar por defecto antes que filtrar contenido de otras empresas.
 */
export async function resolveQuestionsOrgScope(
  supabase: SupabaseServerClient,
  user: ScopeUser | null,
  courseId?: string | null,
  requestedOrganizationId?: string | null,
): Promise<QuestionsOrgScope> {
  if (!user) {
    return { isPlatformAdmin: false, organizationId: null }
  }

  // El alcance se resuelve también para el superadmin: puede pertenecer a una
  // organización y publicar en ella, aunque su lectura no esté limitada.
  const isPlatformAdmin = isPlatformAdminRole(user.platform_role)

  if (courseId) {
    const enrolledOrganizationId = await resolveCourseOrganizationScope(
      supabase,
      user.id,
      courseId,
      requestedOrganizationId,
    )

    if (enrolledOrganizationId) {
      return { isPlatformAdmin, organizationId: enrolledOrganizationId }
    }
  }

  // Respaldo para quien no está inscrito (instructor o superadmin que solo
  // consulta) y para los llamadores que aún no acotan por curso.
  const membership = await resolveUserPrimaryMembership(supabase, user.id)

  return {
    isPlatformAdmin,
    organizationId: membership?.organization_id ?? null,
  }
}

/**
 * Aplica el filtro de organización a una query de `course_questions`.
 *
 * El superadmin no filtra. Cualquier otro usuario queda restringido a su
 * organización; si no tiene una, la query se fuerza a vacío.
 */
export function applyQuestionsOrgScope<
  Query extends { eq: (column: string, value: string) => Query },
>(query: Query, scope: QuestionsOrgScope): Query {
  if (scope.isPlatformAdmin) {
    return query
  }

  if (!scope.organizationId) {
    // Sin organización no hay comunidad visible. Igualdad imposible en un uuid
    // para devolver siempre un conjunto vacío sin ramificar en cada llamador.
    return query.eq('organization_id', EMPTY_SCOPE_SENTINEL)
  }

  return query.eq('organization_id', scope.organizationId)
}

/** `true` si el usuario puede leer/interactuar con la pregunta indicada. */
export function isQuestionInOrgScope(
  question: OrgScopedQuestionRow,
  scope: QuestionsOrgScope,
): boolean {
  if (scope.isPlatformAdmin) {
    return true
  }

  return Boolean(scope.organizationId) && question.organization_id === scope.organizationId
}
