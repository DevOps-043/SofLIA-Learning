import type { createAdminSupabase } from './admin-client'
import { applyPayloadToCourse } from './apply-payload'
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types'
import type { CourseEnginePayload } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>
type CourseInsertPayload = TablesInsert<'courses'>
type CourseUpdatePayload = TablesUpdate<'courses'>

export async function createNewCourseFromPayload(
  supabase: AdminSupabaseClient,
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): Promise<string> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert(buildCourseCreatePayload(payload, instructorId, adminId))
    .select()
    .single()

  if (error) throw new Error(`Course insert failed: ${error.message}`)

  await applyPayloadToCourse(supabase, course.id, instructorId, payload)
  return course.id
}

export async function updateExistingCourseFromPayload(
  supabase: AdminSupabaseClient,
  courseId: string,
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update(buildCourseUpdatePayload(payload, instructorId, adminId))
    .eq('id', courseId)

  if (error) throw new Error(`Course update failed: ${error.message}`)

  await applyPayloadToCourse(supabase, courseId, instructorId, payload)
}

function buildBaseCourseMutationPayload(
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): Omit<CourseInsertPayload, 'slug'> {
  const { course } = payload
  return {
    title: course.title,
    description: course.description || course.title,
    category: course.category || 'General',
    level: course.level || 'beginner',
    instructor_id: instructorId,
    thumbnail_url: course.thumbnail_url ?? null,
    price: course.price || 0,
    is_active: true,
    approval_status: 'approved',
    approved_by: adminId,
    approved_at: new Date().toISOString(),
  }
}

function buildCourseCreatePayload(
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): CourseInsertPayload {
  return {
    ...buildBaseCourseMutationPayload(payload, instructorId, adminId),
    learning_objectives: [],
    slug: payload.course.slug || buildCourseSlug(payload.course.title),
  }
}

function buildCourseUpdatePayload(
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): CourseUpdatePayload {
  return {
    ...buildBaseCourseMutationPayload(payload, instructorId, adminId),
    updated_at: new Date().toISOString(),
  }
}

function buildCourseSlug(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `course-${Date.now()}`
}
