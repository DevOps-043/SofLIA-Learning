import { createAdminClient } from '../../../../lib/supabase/admin'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { logger } from '../../../../lib/utils/logger'

interface HierarchyCourseAssignmentRow {
  id: string
  course_id: string
  assigned_at?: string | null
  due_date?: string | null
  status?: string | null
  courses?: {
    id: string
    title?: string | null
    slug?: string | null
    thumbnail_url?: string | null
    category?: string | null
    level?: string | null
  } | null
}

interface HierarchyCourseAssignmentWrite {
  organization_id: string
  course_id: string
  assigned_by?: string | null
  status?: string | null
}

export async function getCompanyCourses(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<
    HierarchyCourseAssignmentRow,
    HierarchyCourseAssignmentWrite
  >(supabase, 'hierarchy_course_assignments')
    .select(`
      id,
      course_id,
      assigned_at,
      due_date,
      status,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        category,
        level
      )
    `)
    .eq('organization_id', id)

  if (error) {
    logger.error('Error fetching company courses:', error)
    throw error
  }

  return data || []
}

export async function assignCourseToCompany(companyId: string, courseId: string, adminId: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<
    HierarchyCourseAssignmentRow,
    HierarchyCourseAssignmentWrite
  >(supabase, 'hierarchy_course_assignments')
    .insert({
      organization_id: companyId,
      course_id: courseId,
      assigned_by: adminId,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    logger.error('Error assigning course to company:', error)
    throw error
  }

  return data
}

export async function removeCourseFromCompany(companyId: string, courseId: string) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<
    HierarchyCourseAssignmentRow,
    HierarchyCourseAssignmentWrite
  >(supabase, 'hierarchy_course_assignments')
    .delete()
    .eq('organization_id', companyId)
    .eq('course_id', courseId)

  if (error) {
    logger.error('Error removing course from company:', error)
    throw error
  }

  return { success: true }
}

export async function getUserCourseAssignments(companyId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select(`
      id,
      user_id,
      course_id,
      assigned_at,
      status,
      completion_percentage,
      source_learning_path_id,
      courses (
        id,
        title,
        slug,
        thumbnail_url
      ),
      users:user_id (
        id,
        email,
        first_name,
        last_name,
        display_name
      ),
      learning_paths:source_learning_path_id (
        id,
        title
      )
    `)
    .eq('organization_id', companyId)

  if (error) {
    logger.error('Error fetching user course assignments:', error)
    throw error
  }

  return data || []
}

export async function assignCourseToUser(companyId: string, userId: string, courseId: string, adminId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .insert({
      organization_id: companyId,
      user_id: userId,
      course_id: courseId,
      assigned_by: adminId,
      status: 'assigned',
    })
    .select()
    .single()

  if (error) {
    logger.error('Error assigning course to user:', error)
    throw error
  }

  return data
}

export async function removeCourseFromUser(assignmentId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('organization_course_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    logger.error('Error removing user course assignment:', error)
    throw error
  }

  return { success: true }
}
