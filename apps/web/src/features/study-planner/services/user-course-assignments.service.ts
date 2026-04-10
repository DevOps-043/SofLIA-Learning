import { createClient } from '../../../lib/supabase/server'
import type {
  B2BCourseAssignment,
  B2CCoursePurchase,
  CourseAssignment,
  TeamCourseAssignment,
  UserType,
} from '../types/user-context.types'
import {
  COURSE_INFO_SELECT,
  PERSON_NAME_SELECT,
} from './course-query.shared'
import {
  buildCoursePurchase,
  buildOrganizationAssignment,
  buildTeamAssignment,
  hasUpcomingDueDate,
} from './user-course-assignments/mappers'
import {
  coursePurchasesTable,
  enrollmentProgressTable,
  hierarchyAssignmentsTable,
  organizationAssignmentsTable,
  organizationRegionsTable,
  organizationTeamsTable,
  organizationUsersTable,
  organizationZonesTable,
  regionAssignmentLinksTable,
  teamAssignmentLinksTable,
  workTeamAssignmentsTable,
  workTeamMembersTable,
  zoneAssignmentLinksTable,
} from './user-course-assignments/tables'
import type {
  EnrollmentProgressRow,
  HierarchyEntity,
  HierarchyEntityType,
} from './user-course-assignments/types'

export class UserCourseAssignmentsService {
  static async getB2BCourseAssignments(
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

  static async getTeamCourseAssignments(
    userId: string,
  ): Promise<TeamCourseAssignment[]> {
    const supabase = await createClient()

    const { data: orgUser, error: orgUserError } = await organizationUsersTable(
      supabase,
    )
      .select('organization_id, team_id, zone_id, region_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (orgUserError || !orgUser?.organization_id) {
      return this.getLegacyTeamCourseAssignments(userId)
    }

    const entity: HierarchyEntity | null =
      orgUser.team_id != null
        ? { type: 'team', id: orgUser.team_id }
        : orgUser.zone_id != null
          ? { type: 'zone', id: orgUser.zone_id }
          : orgUser.region_id != null
            ? { type: 'region', id: orgUser.region_id }
            : null

    if (!entity) {
      return []
    }

    const assignmentIds = await this.getHierarchyAssignmentIds(
      supabase,
      entity.type,
      entity.id,
    )

    if (assignmentIds.length === 0) {
      return []
    }

    const { data, error } = await hierarchyAssignmentsTable(supabase)
      .select(`
        id,
        organization_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        message,
        courses:course_id (
          ${COURSE_INFO_SELECT}
        ),
        assigner:assigned_by (
          ${PERSON_NAME_SELECT}
        )
      `)
      .eq('organization_id', orgUser.organization_id)
      .in('id', assignmentIds)
      .in('status', ['active'])

    if (error) {
      console.error('Error obteniendo asignaciones jerarquicas:', error)
      return this.getLegacyTeamCourseAssignments(userId)
    }

    const entityName = await this.getHierarchyEntityName(
      supabase,
      entity.type,
      entity.id,
    )

    return (data ?? [])
      .map((item) => buildTeamAssignment(item, entity.id, entityName))
      .filter((assignment): assignment is TeamCourseAssignment => Boolean(assignment))
  }

  private static async getHierarchyAssignmentIds(
    supabase: unknown,
    entityType: HierarchyEntityType,
    entityId: string,
  ): Promise<string[]> {
    const query =
      entityType === 'team'
        ? teamAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('team_id', entityId)
        : entityType === 'zone'
          ? zoneAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('zone_id', entityId)
          : regionAssignmentLinksTable(supabase).select('hierarchy_assignment_id').eq('region_id', entityId)

    const { data } = await query

    return (data ?? [])
      .map((item) => item.hierarchy_assignment_id)
      .filter((assignmentId): assignmentId is string => Boolean(assignmentId))
  }

  private static async getHierarchyEntityName(
    supabase: unknown,
    entityType: HierarchyEntityType,
    entityId: string,
  ): Promise<string> {
    const query =
      entityType === 'team'
        ? organizationTeamsTable(supabase).select('name').eq('id', entityId).single()
        : entityType === 'zone'
          ? organizationZonesTable(supabase).select('name').eq('id', entityId).single()
          : organizationRegionsTable(supabase).select('name').eq('id', entityId).single()

    const { data } = await query

    if (data?.name) {
      return data.name
    }

    switch (entityType) {
      case 'team':
        return 'Equipo'
      case 'zone':
        return 'Zona'
      default:
        return 'Region'
    }
  }

  private static async getLegacyTeamCourseAssignments(
    userId: string,
  ): Promise<TeamCourseAssignment[]> {
    const supabase = await createClient()

    const { data: teams, error: teamsError } = await workTeamMembersTable(supabase)
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (teamsError || !teams || teams.length === 0) {
      return []
    }

    const teamIds = Array.from(new Set(teams.map((team) => team.team_id)))

    const { data, error } = await workTeamAssignmentsTable(supabase)
      .select(`
        id,
        team_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        message,
        work_teams:team_id (
          name
        ),
        courses:course_id (
          ${COURSE_INFO_SELECT}
        ),
        assigner:assigned_by (
          ${PERSON_NAME_SELECT}
        )
      `)
      .in('team_id', teamIds)
      .neq('status', 'completed')

    if (error) {
      console.error('Error obteniendo asignaciones de equipos legacy:', error)
      return []
    }

    return (data ?? [])
      .map((item) =>
        buildTeamAssignment(item, item.team_id, item.work_teams?.name ?? 'Equipo'),
      )
      .filter((assignment): assignment is TeamCourseAssignment => Boolean(assignment))
  }

  static async getB2CCoursePurchases(
    userId: string,
  ): Promise<B2CCoursePurchase[]> {
    const supabase = await createClient()

    const { data, error } = await coursePurchasesTable(supabase)
      .select(`
        purchase_id,
        user_id,
        course_id,
        purchased_at,
        access_status,
        expires_at,
        courses:course_id (
          ${COURSE_INFO_SELECT}
        )
      `)
      .eq('user_id', userId)
      .eq('access_status', 'active')

    if (error) {
      console.error('Error obteniendo compras de cursos B2C:', error)
      return []
    }

    const courseIds = Array.from(
      new Set((data ?? []).map((item) => item.course_id)),
    )
    let enrollments: EnrollmentProgressRow[] = []

    if (courseIds.length > 0) {
      const { data: enrollmentRows } = await enrollmentProgressTable(supabase)
        .select('course_id, progress_percentage')
        .eq('user_id', userId)
        .in('course_id', courseIds)

      enrollments = enrollmentRows ?? []
    }

    const progressByCourseId = new Map(
      enrollments.map((enrollment) => [
        enrollment.course_id,
        enrollment.progress_percentage ?? 0,
      ]),
    )

    return (data ?? [])
      .map((item) =>
        buildCoursePurchase(item, progressByCourseId.get(item.course_id) ?? 0),
      )
      .filter((purchase): purchase is B2CCoursePurchase => Boolean(purchase))
  }

  static async getUserCourses(
    userId: string,
    userType: UserType,
  ): Promise<CourseAssignment[]> {
    if (userType === 'b2b') {
      const [orgAssignments, teamAssignments] = await Promise.all([
        this.getB2BCourseAssignments(userId),
        this.getTeamCourseAssignments(userId),
      ])

      const courses: CourseAssignment[] = orgAssignments.map((assignment) => ({
        courseId: assignment.courseId,
        course: assignment.course,
        userType: 'b2b',
        dueDate: assignment.dueDate,
        assignedBy: assignment.assignedByName,
        organizationId: assignment.organizationId,
        organizationName: assignment.organizationName,
        status: assignment.status,
        completionPercentage: assignment.completionPercentage,
        source: 'organization',
      }))

      // Deduplication key: courseId + organizationId.
      // The same course assigned by two different organizations must produce two
      // independent entries, each plannable separately (one plan per org context).
      const assignedKeys = new Set(
        courses.map((course) => `${course.courseId}::${course.organizationId ?? ''}`)
      )

      for (const assignment of teamAssignments) {
        const key = `${assignment.courseId}::`
        if (!assignedKeys.has(key)) {
          courses.push({
            courseId: assignment.courseId,
            course: assignment.course,
            userType: 'b2b',
            dueDate: assignment.dueDate,
            assignedBy: assignment.assignedByName,
            status: assignment.status,
            completionPercentage: 0,
            source: 'team',
          })
          assignedKeys.add(key)
        }
      }

      return courses
    }

    const purchases = await this.getB2CCoursePurchases(userId)

    return purchases.map((purchase) => ({
      courseId: purchase.courseId,
      course: purchase.course,
      userType: 'b2c',
      status: 'active',
      completionPercentage: purchase.completionPercentage ?? 0,
      source: 'purchase',
    }))
  }

  static async getUpcomingDeadlines(
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
}
