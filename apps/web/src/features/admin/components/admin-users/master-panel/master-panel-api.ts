import type {
  OrgCourseCatalogItem,
  OrgLearningPathCatalogItem,
  OrganizationRole,
  UserMasterPanelData,
} from './types'

/**
 * Cliente HTTP del Panel Maestro. Reutiliza las rutas company-scoped existentes
 * para mutaciones de membresía/cursos/rutas y las rutas user-centric nuevas
 * (master-panel, memberships, password). Todas requieren rol Administrador.
 */

async function parseError(response: Response, fallback: string): Promise<Error> {
  const data: unknown = await response.json().catch(() => ({}))
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const message =
    (typeof record.message === 'string' && record.message) ||
    (typeof record.error === 'string' && record.error) ||
    fallback
  const error = new Error(message)
  error.name = typeof record.error === 'string' ? record.error : 'MasterPanelApiError'
  return error
}

async function requestJson<T>(url: string, init: RequestInit, fallbackError: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  if (!response.ok) throw await parseError(response, fallbackError)
  return response.json() as Promise<T>
}

/**
 * Cache en memoria con TTL corto (stale-while-revalidate manual): abrir el
 * panel de un usuario recién prefetcheado (hover) o reabrirlo es instantáneo.
 * Las mutaciones refrescan con bypassCache, que sobrescribe la entrada.
 */
interface CacheEntry<T> {
  promise: Promise<T>
  cachedAt: number
}

const AGGREGATE_CACHE_TTL_MS = 30_000
const CATALOG_CACHE_TTL_MS = 60_000

const aggregateCache = new Map<string, CacheEntry<UserMasterPanelData>>()
const catalogCache = new Map<string, CacheEntry<unknown>>()

function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  bypass = false,
): Promise<T> {
  const entry = cache.get(key)
  if (!bypass && entry && Date.now() - entry.cachedAt < ttlMs) return entry.promise
  const promise = fetcher()
  cache.set(key, { promise, cachedAt: Date.now() })
  promise.catch(() => {
    // No cachear errores: el siguiente intento vuelve a la red.
    if (cache.get(key)?.promise === promise) cache.delete(key)
  })
  return promise
}

async function fetchMasterPanelData(userId: string): Promise<UserMasterPanelData> {
  const data = await requestJson<{ success: boolean } & UserMasterPanelData>(
    `/api/admin/users/${userId}/master-panel`,
    { cache: 'no-store' },
    'Error al cargar la información del usuario',
  )
  return {
    memberships: data.memberships ?? [],
    courseAssignments: data.courseAssignments ?? [],
    learningPathAssignments: data.learningPathAssignments ?? [],
  }
}

export function getMasterPanelData(
  userId: string,
  options: { bypassCache?: boolean } = {},
): Promise<UserMasterPanelData> {
  return readCache(
    aggregateCache,
    userId,
    AGGREGATE_CACHE_TTL_MS,
    () => fetchMasterPanelData(userId),
    options.bypassCache,
  )
}

/** ¿Hay datos frescos en cache? Permite abrir el panel sin skeleton. */
export function hasFreshMasterPanelData(userId: string): boolean {
  const entry = aggregateCache.get(userId)
  return Boolean(entry && Date.now() - entry.cachedAt < AGGREGATE_CACHE_TTL_MS)
}

/** Prefetch fire-and-forget (hover sobre la card del usuario). */
export function prefetchMasterPanelData(userId: string): void {
  void getMasterPanelData(userId).catch(() => {})
}

export async function addMembership(
  userId: string,
  body: { organizationId: string; role: OrganizationRole; jobTitle?: string | null },
): Promise<void> {
  await requestJson(
    `/api/admin/users/${userId}/memberships`,
    { method: 'POST', body: JSON.stringify(body) },
    'Error al agregar el usuario a la organización',
  )
}

export async function updateMembershipRole(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/members/${userId}`,
    { method: 'PUT', body: JSON.stringify({ role }) },
    'Error al actualizar el rol',
  )
}

export async function removeMembership(organizationId: string, userId: string): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/members/${userId}`,
    { method: 'DELETE' },
    'Error al quitar al usuario de la organización',
  )
}

export async function assignCourse(
  organizationId: string,
  userId: string,
  courseId: string,
): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/user-assignments`,
    { method: 'POST', body: JSON.stringify({ userId, courseId }) },
    'Error al asignar el curso',
  )
}

export async function removeCourseAssignment(
  organizationId: string,
  assignmentId: string,
): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/user-assignments?assignmentId=${assignmentId}`,
    { method: 'DELETE' },
    'Error al quitar el curso',
  )
}

export async function assignLearningPath(
  organizationId: string,
  userId: string,
  learningPathId: string,
): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/user-learning-path-assignments`,
    { method: 'POST', body: JSON.stringify({ userId, learningPathId }) },
    'Error al asignar la ruta',
  )
}

export async function revokeLearningPath(
  organizationId: string,
  assignmentId: string,
): Promise<void> {
  await requestJson(
    `/api/admin/companies/${organizationId}/user-learning-path-assignments?assignmentId=${assignmentId}`,
    { method: 'DELETE' },
    'Error al revocar la ruta',
  )
}

export async function setUserPassword(
  userId: string,
  body: { new_password: string; confirm_password: string },
): Promise<void> {
  await requestJson(
    `/api/admin/users/${userId}/password`,
    { method: 'POST', body: JSON.stringify(body) },
    'Error al actualizar la contraseña',
  )
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await requestJson(
    `/api/admin/users/${userId}/sessions/revoke`,
    { method: 'POST', body: JSON.stringify({}) },
    'Error al revocar las sesiones',
  )
}

interface OrgCoursesResponse {
  success: boolean
  courses?: Array<{ course_id: string; courses: { title: string; category?: string | null } }>
}

export function getOrgCourseCatalog(organizationId: string): Promise<OrgCourseCatalogItem[]> {
  return readCache(
    catalogCache as Map<string, CacheEntry<OrgCourseCatalogItem[]>>,
    `courses:${organizationId}`,
    CATALOG_CACHE_TTL_MS,
    async () => {
      const data = await requestJson<OrgCoursesResponse>(
        `/api/admin/companies/${organizationId}/courses`,
        { cache: 'no-store' },
        'Error al cargar el catálogo de cursos',
      )
      return (data.courses ?? []).map((row) => ({
        courseId: row.course_id,
        title: row.courses?.title ?? '',
        category: row.courses?.category ?? null,
      }))
    },
  )
}

interface OrgLearningPathsResponse {
  success: boolean
  assignments?: Array<{
    learning_path_id: string
    learning_path: { title: string; item_count?: number } | null
  }>
}

export function getOrgLearningPathCatalog(
  organizationId: string,
): Promise<OrgLearningPathCatalogItem[]> {
  return readCache(
    catalogCache as Map<string, CacheEntry<OrgLearningPathCatalogItem[]>>,
    `learning-paths:${organizationId}`,
    CATALOG_CACHE_TTL_MS,
    async () => {
      const data = await requestJson<OrgLearningPathsResponse>(
        `/api/admin/companies/${organizationId}/learning-paths`,
        { cache: 'no-store' },
        'Error al cargar el catálogo de rutas',
      )
      return (data.assignments ?? []).map((row) => ({
        learningPathId: row.learning_path_id,
        title: row.learning_path?.title ?? '',
        itemCount: row.learning_path?.item_count ?? 0,
      }))
    },
  )
}
