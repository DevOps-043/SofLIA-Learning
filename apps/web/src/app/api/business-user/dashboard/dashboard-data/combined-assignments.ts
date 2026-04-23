import type {
  CombinedAssignmentRow,
  DirectAssignmentRow,
  TeamAssignmentRow,
} from './types'

export function buildCombinedAssignments(
  directAssignments: DirectAssignmentRow[],
  teamAssignments: TeamAssignmentRow[],
) {
  const courseIdSet = new Set<string>()
  const combinedAssignments: CombinedAssignmentRow[] = []

  directAssignments.forEach((assignment) => {
    if (!assignment.courses || courseIdSet.has(assignment.course_id)) return
    courseIdSet.add(assignment.course_id)
    combinedAssignments.push({ ...assignment, source: 'direct' })
  })

  teamAssignments.forEach((assignment) => {
    if (!assignment.courses || courseIdSet.has(assignment.course_id)) return
    courseIdSet.add(assignment.course_id)
    combinedAssignments.push({
      id: assignment.id,
      course_id: assignment.course_id,
      status: assignment.status,
      completion_percentage: 0,
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date,
      completed_at: null,
      courses: assignment.courses,
      source: 'team',
    })
  })

  return { combinedAssignments, courseIds: Array.from(courseIdSet) }
}
