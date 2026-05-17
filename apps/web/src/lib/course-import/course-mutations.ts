import type { createAdminSupabase } from './admin-client'
import { applyPayloadToCourse } from './apply-payload'
import type { CourseEnginePayload } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>

export async function createNewCourseFromPayload(
  supabase: AdminSupabaseClient,
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
): Promise<string> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert(buildCourseMutationPayload(payload, instructorId, adminId, true))
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
    .update(buildCourseMutationPayload(payload, instructorId, adminId, false))
    .eq('id', courseId)

  if (error) throw new Error(`Course update failed: ${error.message}`)

  await applyPayloadToCourse(supabase, courseId, instructorId, payload)
}

function buildCourseMutationPayload(
  payload: CourseEnginePayload,
  instructorId: string,
  adminId: string,
  isCreate: boolean,
) {
  const { course } = payload
  return {
    title: course.title,
    description: course.description || course.title,
    category: course.category || 'General',
    level: course.level || 'beginner',
    instructor_id: instructorId,
    thumbnail_url: course.thumbnail_url ?? null,
    ...(isCreate ? { slug: course.slug } : {}),
    price: course.price || 0,
    is_active: true,
    approval_status: 'approved',
    approved_by: adminId,
    approved_at: new Date().toISOString(),
    ...(isCreate ? { learning_objectives: [] } : { updated_at: new Date().toISOString() }),
  }
}
