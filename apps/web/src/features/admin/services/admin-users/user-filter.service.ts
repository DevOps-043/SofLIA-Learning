import { fromLoose } from '@/lib/supabase/looseQuery'
import type { createAdminClient } from './client'

type AdminClient = ReturnType<typeof createAdminClient>

/** Tope defensivo por consulta para evitar cargas no acotadas en el filtrado. */
const FILTER_FETCH_LIMIT = 10000

export interface AdminUserDirectoryFilters {
  organizationId?: string
  courseId?: string
  learningPathId?: string
}

/**
 * Resuelve el conjunto de user ids que cumplen los filtros de empresa / curso /
 * learning path. Devuelve:
 * - `null` cuando no hay filtros activos (sin restricción por id).
 * - `string[]` (posiblemente vacío) con la intersección de los filtros activos.
 */
export async function resolveFilteredUserIds(
  supabase: AdminClient,
  filters: AdminUserDirectoryFilters,
): Promise<string[] | null> {
  const idSets: string[][] = []

  if (filters.organizationId) {
    idSets.push(await userIdsByOrganization(supabase, filters.organizationId))
  }
  if (filters.courseId) {
    idSets.push(await userIdsByCourse(supabase, filters.courseId))
  }
  if (filters.learningPathId) {
    idSets.push(await userIdsByLearningPath(supabase, filters.learningPathId))
  }

  if (idSets.length === 0) {
    return null
  }

  return intersectIdSets(idSets)
}

async function userIdsByOrganization(
  supabase: AdminClient,
  organizationId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .limit(FILTER_FETCH_LIMIT)

  return uniqueUserIds((data ?? []).map((row) => row.user_id))
}

async function userIdsByCourse(supabase: AdminClient, courseId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_course_enrollments')
    .select('user_id')
    .eq('course_id', courseId)
    .limit(FILTER_FETCH_LIMIT)

  return uniqueUserIds((data ?? []).map((row) => row.user_id))
}

async function userIdsByLearningPath(
  supabase: AdminClient,
  learningPathId: string,
): Promise<string[]> {
  // 1) Asignaciones individuales del learning path.
  const directResult = await fromLoose<{ user_id: string | null }>(
    supabase,
    'user_learning_path_assignments',
  )
    .select('user_id')
    .eq('learning_path_id', learningPathId)
    .limit(FILTER_FETCH_LIMIT)

  const directUserIds = uniqueUserIds(
    ((directResult.data as Array<{ user_id: string | null }> | null) ?? []).map(
      (row) => row.user_id,
    ),
  )

  // 2) Asignaciones a nivel organización: todos los usuarios de esas orgs.
  const orgResult = await fromLoose<{ organization_id: string | null }>(
    supabase,
    'organization_learning_path_assignments',
  )
    .select('organization_id')
    .eq('learning_path_id', learningPathId)
    .limit(FILTER_FETCH_LIMIT)

  const organizationIds = Array.from(
    new Set(
      ((orgResult.data as Array<{ organization_id: string | null }> | null) ?? [])
        .map((row) => row.organization_id)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (organizationIds.length === 0) {
    return directUserIds
  }

  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id')
    .in('organization_id', organizationIds)
    .limit(FILTER_FETCH_LIMIT)

  const orgAssignedUserIds = (orgUsers ?? []).map((row) => row.user_id)

  return uniqueUserIds([...directUserIds, ...orgAssignedUserIds])
}

function uniqueUserIds(values: Array<string | null>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  )
}

function intersectIdSets(idSets: string[][]): string[] {
  if (idSets.length === 1) return idSets[0]
  const [first, ...rest] = idSets.sort((a, b) => a.length - b.length)
  let current = new Set(first)
  for (const set of rest) {
    const next = new Set(set)
    current = new Set([...current].filter((id) => next.has(id)))
    if (current.size === 0) break
  }
  return Array.from(current)
}
