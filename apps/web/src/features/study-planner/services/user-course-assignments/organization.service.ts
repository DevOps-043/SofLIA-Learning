import { createClient } from '../../../../lib/supabase/server'
import type { B2BCourseAssignment } from '../../types/user-context.types'
import {
  COURSE_INFO_SELECT,
  PERSON_NAME_SELECT,
} from '../course-query.shared'
import {
  buildOrganizationAssignment,
  hasUpcomingDueDate,
} from './mappers'
import { organizationAssignmentsTable } from './tables'

export async function getB2BCourseAssignments(
  userId: string,
): Promise<B2BCourseAssignment[]> {
  const supabase = await createClient()

  const { data, error } = await organizationAssignmentsTable(supabase)
    .select(`
      id,
      organization_id,
      user_id,
      course_id,
      assigned_by,
      assigned_at,
      due_date,
      status,
      completion_percentage,
      completed_at,
      message,
      courses:course_id (
        ${COURSE_INFO_SELECT}
      ),
      assigner:assigned_by (
        ${PERSON_NAME_SELECT}
      ),
      organization:organization_id (
        name
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'cancelled')

  if (error) {
    console.error('Error obteniendo asignaciones de cursos B2B:', error)
    return []
  }

  return (data ?? [])
    .filter((item) => hasUpcomingDueDate(item.due_date))
    .map(buildOrganizationAssignment)
    .filter((assignment): assignment is B2BCourseAssignment => Boolean(assignment))
}

export async function getUpcomingDeadlines(
  userId: string,
  daysAhead = 14,
): Promise<B2BCourseAssignment[]> {
  const supabase = await createClient()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data, error } = await organizationAssignmentsTable(supabase)
    .select(`
      id,
      organization_id,
      user_id,
      course_id,
      assigned_by,
      assigned_at,
      due_date,
      status,
      completion_percentage,
      completed_at,
      message,
      courses:course_id (
        ${COURSE_INFO_SELECT}
      )
    `)
    .eq('user_id', userId)
    .not('due_date', 'is', null)
    .lt('due_date', futureDate.toISOString())
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error obteniendo plazos proximos:', error)
    return []
  }

  return (data ?? [])
    .map(buildOrganizationAssignment)
    .filter((assignment): assignment is B2BCourseAssignment => Boolean(assignment))
}
