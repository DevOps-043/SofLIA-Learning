import type { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  fetchAssignments,
  fetchCertificates,
  fetchEnrollments,
  fetchLessonProgress,
} from './query-collections'
import type { AssignmentRow, CourseInfo, OrgUserRow, ProgressCollections } from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function fetchOrganizationUsers(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgUserRow[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id, role, status, users!organization_users_user_id_fkey (id, username, email, first_name, last_name, display_name, profile_picture_url, last_login_at)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  if (error) {
    logger.error('Error fetching organization users:', error)
    throw new Error('Error al obtener usuarios de la organización')
  }

  return (data || []) as OrgUserRow[]
}

export async function fetchProgressCollections(
  supabase: SupabaseClient,
  organizationId: string,
  userIds: string[],
): Promise<ProgressCollections> {
  const [assignments, enrollments, lessonProgress, certificates] = await Promise.all([
    fetchAssignments(supabase, organizationId, userIds),
    fetchEnrollments(supabase, organizationId, userIds),
    fetchLessonProgress(supabase, organizationId, userIds),
    fetchCertificates(supabase, organizationId, userIds),
  ])

  return { assignments, enrollments, lessonProgress, certificates }
}

export async function fetchCourseInfoMap(
  supabase: SupabaseClient,
  assignments: AssignmentRow[],
): Promise<Map<string, CourseInfo>> {
  const courseIds = [...new Set(assignments.map((assignment) => assignment.course_id))]
  if (courseIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url')
    .in('id', courseIds)

  if (error) {
    logger.error('Error fetching courses:', error)
    return new Map()
  }

  return new Map((data || []).map((course) => [course.id, {
    id: course.id,
    title: course.title,
    slug: course.slug || null,
    thumbnail_url: course.thumbnail_url || null,
  }]))
}
