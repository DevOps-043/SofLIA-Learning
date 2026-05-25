import type { CombinedAssignmentRow, DirectAssignmentRow, TeamAssignmentRow } from './types'

export function combineDashboardAssignments(
  directAssignments: DirectAssignmentRow[],
  teamCourseAssignments: TeamAssignmentRow[]
) {
  const courseIdSet = new Set<string>()
  const combinedAssignments: CombinedAssignmentRow[] = []

  for (const assignment of directAssignments) {
    if (!assignment.courses || courseIdSet.has(assignment.course_id)) continue
    courseIdSet.add(assignment.course_id)
    combinedAssignments.push({ ...assignment, source: 'direct' })
  }

  for (const teamAssignment of teamCourseAssignments) {
    if (!teamAssignment.courses || courseIdSet.has(teamAssignment.course_id)) continue
    courseIdSet.add(teamAssignment.course_id)
    combinedAssignments.push({
      id: teamAssignment.id,
      course_id: teamAssignment.course_id,
      status: teamAssignment.status,
      completion_percentage: 0,
      assigned_at: teamAssignment.assigned_at,
      due_date: teamAssignment.due_date,
      completed_at: null,
      courses: teamAssignment.courses,
      source: 'team',
    })
  }

  return {
    combinedAssignments,
    courseIds: Array.from(courseIdSet),
  }
}
