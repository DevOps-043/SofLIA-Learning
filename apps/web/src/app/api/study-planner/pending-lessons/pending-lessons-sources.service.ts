import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { normalizeCourseInfo } from './pending-lessons.utils'
import type {
  CourseAssignmentRow,
  CourseSource,
  EnrollmentRow,
} from './pending-lessons.types'

type StudyPlannerSupabaseClient = Awaited<ReturnType<typeof createClient>>

function isAssignmentStillActive(dueDate: string | null, today: string): boolean {
  if (!dueDate) {
    return true
  }

  const due = new Date(dueDate)
  const current = new Date(today)
  due.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)
  return due >= current
}

async function getHierarchyAssignmentIds(params: {
  orgUser: {
    team_id?: string | null
    zone_id?: string | null
    region_id?: string | null
  }
  supabase: StudyPlannerSupabaseClient
}): Promise<string[]> {
  if (params.orgUser.team_id) {
    const { data } = await params.supabase
      .from('team_course_assignments')
      .select('hierarchy_assignment_id')
      .eq('team_id', params.orgUser.team_id)

    return data?.map((row: { hierarchy_assignment_id: string }) => row.hierarchy_assignment_id) || []
  }

  if (params.orgUser.zone_id) {
    const { data } = await params.supabase
      .from('zone_course_assignments')
      .select('hierarchy_assignment_id')
      .eq('zone_id', params.orgUser.zone_id)

    return data?.map((row: { hierarchy_assignment_id: string }) => row.hierarchy_assignment_id) || []
  }

  if (params.orgUser.region_id) {
    const { data } = await params.supabase
      .from('region_course_assignments')
      .select('hierarchy_assignment_id')
      .eq('region_id', params.orgUser.region_id)

    return data?.map((row: { hierarchy_assignment_id: string }) => row.hierarchy_assignment_id) || []
  }

  return []
}

function pushUniqueCourseSource(params: {
  assignment: CourseAssignmentRow | EnrollmentRow
  courseSources: CourseSource[]
  dueDate: string | null
  source: CourseSource['source']
}) {
  if (params.courseSources.some((course) => course.course_id === params.assignment.course_id)) {
    return
  }

  const courseData = normalizeCourseInfo(params.assignment.courses)
  params.courseSources.push({
    course_id: params.assignment.course_id,
    due_date: params.dueDate,
    source: params.source,
    courseInfo: courseData
      ? {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
        }
      : undefined,
  })
}

export async function loadUserCourseSources(params: {
  currentUserId: string
  supabase: StudyPlannerSupabaseClient
}): Promise<CourseSource[]> {
  const courseSources: CourseSource[] = []
  const today = new Date().toISOString().split('T')[0]

  const { data: orgUser } = await params.supabase
    .from('organization_users')
    .select('organization_id, team_id, zone_id, region_id')
    .eq('user_id', params.currentUserId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (orgUser?.organization_id) {
    const { data: orgAssignments, error: orgAssignmentsError } = await params.supabase
      .from('organization_course_assignments')
      .select(`
        course_id,
        due_date,
        status,
        courses:course_id (
          id,
          title,
          description
        )
      `)
      .eq('user_id', params.currentUserId)
      .neq('status', 'cancelled')
      .neq('status', 'completed')

    if (orgAssignmentsError) {
      techDebtLogger.error('Error obteniendo org_assignments:', orgAssignmentsError)
    } else {
      for (const assignment of (orgAssignments as CourseAssignmentRow[] | null) || []) {
        if (!isAssignmentStillActive(assignment.due_date, today)) {
          continue
        }

        pushUniqueCourseSource({
          assignment,
          courseSources,
          dueDate: assignment.due_date,
          source: 'org_assignment',
        })
      }
    }

    const hierarchyAssignmentIds = await getHierarchyAssignmentIds({
      orgUser,
      supabase: params.supabase,
    })

    if (hierarchyAssignmentIds.length > 0) {
      const { data: hierarchyAssignments, error: hierarchyError } = await params.supabase
        .from('hierarchy_course_assignments')
        .select(`
          course_id,
          due_date,
          courses:course_id (
            id,
            title,
            description
          )
        `)
        .in('id', hierarchyAssignmentIds)
        .eq('status', 'active')

      if (hierarchyError) {
        techDebtLogger.error('Error obteniendo hierarchy_assignments:', hierarchyError)
      } else {
        for (const assignment of (hierarchyAssignments as CourseAssignmentRow[] | null) || []) {
          if (!isAssignmentStillActive(assignment.due_date, today)) {
            continue
          }

          pushUniqueCourseSource({
            assignment,
            courseSources,
            dueDate: assignment.due_date,
            source: 'hierarchy_assignment',
          })
        }
      }
    }
  }

  const { data: enrollments, error: enrollmentsError } = await params.supabase
    .from('user_course_enrollments')
    .select(`
      enrollment_id,
      course_id,
      courses (
        id,
        title,
        description
      )
    `)
    .eq('user_id', params.currentUserId)
    .eq('enrollment_status', 'active')

  if (enrollmentsError) {
    techDebtLogger.error('Error obteniendo enrollments:', enrollmentsError)
  } else {
    for (const enrollment of (enrollments as EnrollmentRow[] | null) || []) {
      pushUniqueCourseSource({
        assignment: enrollment,
        courseSources,
        dueDate: null,
        source: 'enrollment',
      })
    }
  }

  return courseSources
}
