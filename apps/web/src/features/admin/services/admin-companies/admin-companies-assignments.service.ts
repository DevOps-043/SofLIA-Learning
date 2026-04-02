import { createClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/utils/logger'

import { buildCompanyDetailedStats } from './admin-companies-detailed-stats.service'

export async function getCompanyCourses(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hierarchy_course_assignments')
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hierarchy_course_assignments')
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
  const supabase = await createClient()
  const { error } = await supabase
    .from('hierarchy_course_assignments')
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select(`
      id,
      user_id,
      course_id,
      assigned_at,
      status,
      completion_percentage,
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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

export async function getCompanyDetailedStats(companyId: string) {
  const supabase = await createClient()
  const [assignmentsResponse, sessionsResponse, membersResponse, pendingInvitationsResponse] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select('course_id, completion_percentage, status, courses(title)')
      .eq('organization_id', companyId),
    supabase
      .from('study_sessions')
      .select('actual_duration_minutes, completed_at, self_evaluation, user_id')
      .eq('organization_id', companyId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true }),
    supabase
      .from('organization_users')
      .select('status, organization_teams(name)')
      .eq('organization_id', companyId),
    supabase
      .from('user_invitations')
      .select('id', { count: 'exact' })
      .eq('organization_id', companyId)
      .eq('status', 'pending'),
  ])

  return buildCompanyDetailedStats({
    assignments: assignmentsResponse.data || [],
    sessions: sessionsResponse.data || [],
    members: membersResponse.data || [],
    pendingInvitationCount: pendingInvitationsResponse.count || 0,
  })
}
