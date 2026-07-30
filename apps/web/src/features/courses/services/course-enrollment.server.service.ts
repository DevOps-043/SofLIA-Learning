import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { createAdminClient } from '@/lib/supabase/admin'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createSupabaseClient>>
  | ReturnType<typeof createAdminClient>

export interface CourseEnrollmentRecord {
  course_id?: string
  enrollment_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
  last_accessed_at: string | null
  enrolled_at: string | null
}

export interface CourseEnrollmentScope extends CourseEnrollmentRecord {
  course_id: string
  user_id: string
}

export function normalizeCourseOrganizationId(value?: string | null) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function sortEnrollmentsByRecency<T extends CourseEnrollmentRecord>(enrollments: T[]) {
  return [...enrollments].sort((left, right) => {
    const leftCompleted = left.enrollment_status === 'completed' ? 1 : 0
    const rightCompleted = right.enrollment_status === 'completed' ? 1 : 0
    if (leftCompleted !== rightCompleted) return rightCompleted - leftCompleted

    const progressDelta =
      (right.overall_progress_percentage ?? 0) -
      (left.overall_progress_percentage ?? 0)
    if (progressDelta !== 0) return progressDelta

    const leftAccessed = Date.parse(left.last_accessed_at || '') || 0
    const rightAccessed = Date.parse(right.last_accessed_at || '') || 0
    if (leftAccessed !== rightAccessed) return rightAccessed - leftAccessed

    const leftEnrolled = Date.parse(left.enrolled_at || '') || 0
    const rightEnrolled = Date.parse(right.enrolled_at || '') || 0
    return rightEnrolled - leftEnrolled
  })
}

export function selectPreferredCourseEnrollment(
  enrollments: CourseEnrollmentRecord[],
  organizationId?: string | null,
) {
  const normalizedOrganizationId = normalizeCourseOrganizationId(organizationId)
  const scopedEnrollments = enrollments.filter((enrollment) =>
    normalizedOrganizationId
      ? enrollment.organization_id === normalizedOrganizationId
      : enrollment.organization_id === null,
  )

  if (scopedEnrollments.length === 0) {
    return null
  }

  return sortEnrollmentsByRecency(scopedEnrollments)[0] ?? null
}

export function mapPreferredCourseEnrollments<T extends CourseEnrollmentRecord & { course_id: string }>(
  enrollments: T[],
  organizationId?: string | null,
) {
  const enrollmentsByCourse = new Map<string, T[]>()

  for (const enrollment of enrollments) {
    const current = enrollmentsByCourse.get(enrollment.course_id) || []
    current.push(enrollment)
    enrollmentsByCourse.set(enrollment.course_id, current)
  }

  const preferredByCourse = new Map<string, T>()

  for (const [courseId, courseEnrollments] of enrollmentsByCourse.entries()) {
    const preferred = selectPreferredCourseEnrollment(
      courseEnrollments,
      organizationId,
    ) as T | null

    if (preferred) {
      preferredByCourse.set(courseId, preferred)
    }
  }

  return preferredByCourse
}

export async function loadCourseEnrollments(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
) {
  const { data } = await supabase
    .from('user_course_enrollments')
    .select(
      'enrollment_id, organization_id, overall_progress_percentage, enrollment_status, last_accessed_at, enrolled_at',
    )
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .order('enrolled_at', { ascending: false, nullsFirst: false })

  return (data || []) as CourseEnrollmentRecord[]
}

/**
 * Ámbito de inscripción a usar cuando quien llama NO tiene organización en la
 * petición (endpoints que no viven bajo `[orgSlug]` ni reciben `orgId`).
 *
 * `resolveCourseEnrollment(..., null)` filtra por `organization_id IS NULL`, que
 * era el caso cuando las inscripciones eran personales. Hoy casi todas
 * pertenecen a una organización, así que ese filtro no encuentra nada y el
 * llamador concluye —incorrectamente— que el usuario no está inscrito.
 *
 * Esto NO concede acceso nuevo: solo reconoce la inscripción que el usuario ya
 * tiene, sea cual sea su ámbito, eligiendo la usada más recientemente. Si no
 * hay ninguna, devuelve null y el llamador sigue rechazando la petición.
 */
export async function resolveAnyScopeCourseEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
) {
  const enrollments = await loadCourseEnrollments(supabase, userId, courseId)
  return sortEnrollmentsByRecency(enrollments)[0] ?? null
}

/**
 * Organización por la que un usuario cursa un curso concreto.
 *
 * Pensado para las funciones acotadas por empresa (comunidad de preguntas):
 * descarta las inscripciones heredadas sin organización, porque una inscripción
 * personal no identifica ninguna comunidad, y devuelve null si el usuario no
 * tiene ninguna inscripción con empresa. Así el llamador puede decidir su
 * propio respaldo en lugar de recibir un ámbito silenciosamente equivocado.
 *
 * `requestedOrganizationId` desempata cuando el usuario pertenece a varias
 * empresas y el llamador sabe desde cuál se navega (el `orgId` de la query
 * string). Solo se acepta si el usuario tiene realmente inscripción en esa
 * organización: sirve para elegir entre las suyas, nunca para alcanzar otra.
 */
export async function resolveCourseOrganizationScope(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  requestedOrganizationId?: string | null,
): Promise<string | null> {
  const enrollments = (
    await loadCourseEnrollments(supabase, userId, courseId)
  ).filter((enrollment) => Boolean(enrollment.organization_id))

  const requested = normalizeCourseOrganizationId(requestedOrganizationId)
  const requestedMatch = requested
    ? enrollments.find((enrollment) => enrollment.organization_id === requested)
    : undefined
  const chosen = requestedMatch ?? sortEnrollmentsByRecency(enrollments)[0]

  return chosen?.organization_id ?? null
}

async function hasActiveOrganizationMembership(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId: string,
) {
  const { data } = await supabase
    .from('organization_users')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return Boolean(data)
}

async function hasDirectCourseAssignment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId: string,
) {
  const { data } = await supabase
    .from('organization_course_assignments')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .or('status.is.null,status.neq.cancelled')
    .limit(1)
    .maybeSingle()

  return Boolean(data)
}

async function hasOrganizationCoursePurchase(
  supabase: SupabaseServerClient,
  courseId: string,
  organizationId: string,
) {
  const { data } = await supabase
    .from('organization_course_purchases')
    .select('purchase_id')
    .eq('organization_id', organizationId)
    .eq('course_id', courseId)
    .eq('access_status', 'active')
    .limit(1)
    .maybeSingle()

  return Boolean(data)
}

async function hasLearningPathCourseAccess(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId: string,
) {
  const { data: pathItems } = await supabase
    .from('learning_path_items')
    .select('learning_path_id')
    .eq('course_id', courseId)

  const learningPathIds = [
    ...new Set((pathItems || []).map((item) => item.learning_path_id)),
  ]

  if (learningPathIds.length === 0) {
    return false
  }

  const [organizationAssignment, userAssignment] = await Promise.all([
    supabase
      .from('organization_learning_path_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .in('learning_path_id', learningPathIds)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_learning_path_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'assigned')
      .in('learning_path_id', learningPathIds)
      .limit(1)
      .maybeSingle(),
  ])

  return Boolean(organizationAssignment.data || userAssignment.data)
}

export async function canUseCourseEnrollmentScope(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const normalizedOrganizationId = normalizeCourseOrganizationId(organizationId)

  if (!normalizedOrganizationId) {
    return false
  }

  const isMember = await hasActiveOrganizationMembership(
    supabase,
    userId,
    normalizedOrganizationId,
  )

  if (!isMember) {
    return false
  }

  const [hasDirectAssignment, hasPurchase, hasLearningPathAccess] =
    await Promise.all([
      hasDirectCourseAssignment(
        supabase,
        userId,
        courseId,
        normalizedOrganizationId,
      ),
      hasOrganizationCoursePurchase(supabase, courseId, normalizedOrganizationId),
      hasLearningPathCourseAccess(
        supabase,
        userId,
        courseId,
        normalizedOrganizationId,
      ),
    ])

  return hasDirectAssignment || hasPurchase || hasLearningPathAccess
}

export async function resolveCourseEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const normalizedOrganizationId = normalizeCourseOrganizationId(organizationId)
  let query = supabase
    .from('user_course_enrollments')
    .select(
      'enrollment_id, user_id, course_id, organization_id, overall_progress_percentage, enrollment_status, last_accessed_at, enrolled_at',
    )
    .eq('user_id', userId)
    .eq('course_id', courseId)

  query = normalizedOrganizationId
    ? query.eq('organization_id', normalizedOrganizationId)
    : query.is('organization_id', null)

  const { data } = await query
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .order('enrolled_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return (data || null) as CourseEnrollmentScope | null
}

export async function ensureCourseEnrollmentScope(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const normalizedOrganizationId = normalizeCourseOrganizationId(organizationId)
  const existingEnrollment = await resolveCourseEnrollment(
    supabase,
    userId,
    courseId,
    normalizedOrganizationId,
  )

  if (existingEnrollment) {
    return existingEnrollment
  }

  const canUseScope = await canUseCourseEnrollmentScope(
    supabase,
    userId,
    courseId,
    normalizedOrganizationId,
  )

  if (!canUseScope) {
    return null
  }

  const now = new Date().toISOString()
  const { data: createdEnrollment, error } = await supabase
    .from('user_course_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      organization_id: normalizedOrganizationId,
      enrollment_status: 'active',
      overall_progress_percentage: 0,
      enrolled_at: now,
      started_at: now,
      last_accessed_at: now,
    })
    .select(
      'enrollment_id, user_id, course_id, organization_id, overall_progress_percentage, enrollment_status, last_accessed_at, enrolled_at',
    )
    .single()

  if (error || !createdEnrollment) {
    return null
  }

  return createdEnrollment as CourseEnrollmentScope
}
