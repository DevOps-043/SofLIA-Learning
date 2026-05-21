import { createClient } from '@/lib/supabase/server'
import { resolveCourseEnrollment } from './course-enrollment.server.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type LearningSummaryAccessError = {
  error: string
  status: 403 | 404 | 500
}

type LearningSummaryCourseAccess = {
  courseId: string
  organizationId: string | null
  supabase: SupabaseServerClient
}

export function normalizeLearningSummaryOrganizationId(value: string | null) {
  return value && value.trim() ? value.trim() : null
}

export function parseLearningSummaryModuleIds(value: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((moduleId) => moduleId.trim())
    .filter(Boolean)
}

export async function resolveLearningSummaryCourseAccess(params: {
  organizationId?: string | null
  slug: string
  userId: string
}): Promise<LearningSummaryCourseAccess | LearningSummaryAccessError> {
  const { organizationId, slug, userId } = params
  const supabase = await createClient()

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (courseError || !course) {
    return { error: 'Curso no encontrado', status: 404 }
  }

  const enrollment = await resolveCourseEnrollment(
    supabase,
    userId,
    course.id,
    organizationId,
  )

  if (!enrollment) {
    return { error: 'No estas inscrito en este curso', status: 403 }
  }

  return {
    courseId: course.id,
    organizationId: enrollment.organization_id || organizationId || null,
    supabase,
  }
}

export async function verifyLearningSummaryModulesBelongToCourse(params: {
  courseId: string
  moduleIds: string[]
  supabase: SupabaseServerClient
}): Promise<true | LearningSummaryAccessError> {
  const { courseId, moduleIds, supabase } = params

  if (moduleIds.length === 0) {
    return true
  }

  const { data: modules, error } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)
    .in('module_id', moduleIds)

  if (error) {
    return { error: 'Error al verificar modulos del curso', status: 500 }
  }

  const allowedModuleIds = new Set((modules || []).map((module) => module.module_id))
  const hasForeignModule = moduleIds.some(
    (moduleId) => !allowedModuleIds.has(moduleId),
  )

  return hasForeignModule
    ? { error: 'Modulo no encontrado', status: 404 }
    : true
}

export async function resolveLearningSummaryModuleAccess(params: {
  moduleId: string
  organizationId?: string | null
  slug: string
  userId: string
}): Promise<LearningSummaryCourseAccess | LearningSummaryAccessError> {
  const courseAccess = await resolveLearningSummaryCourseAccess(params)

  if ('error' in courseAccess) {
    return courseAccess
  }

  const moduleAccess = await verifyLearningSummaryModulesBelongToCourse({
    courseId: courseAccess.courseId,
    moduleIds: [params.moduleId],
    supabase: courseAccess.supabase,
  })

  if (moduleAccess !== true) {
    return moduleAccess
  }

  return courseAccess
}
