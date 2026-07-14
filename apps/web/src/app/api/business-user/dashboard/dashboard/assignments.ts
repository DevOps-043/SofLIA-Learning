import type { CombinedAssignmentRow, DirectAssignmentRow } from './types'

// Las asignaciones por "equipo de trabajo" (tablas work_team_*) se retiraron:
// esas tablas ya no existen. Las asignaciones a usuarios de una organización
// llegan por `organization_course_assignments` (asignación directa).
export function combineDashboardAssignments(directAssignments: DirectAssignmentRow[]) {
  const courseIdSet = new Set<string>()
  const combinedAssignments: CombinedAssignmentRow[] = []

  for (const assignment of directAssignments) {
    if (!assignment.courses || courseIdSet.has(assignment.course_id)) continue
    courseIdSet.add(assignment.course_id)
    combinedAssignments.push({ ...assignment, source: 'direct' })
  }

  return {
    combinedAssignments,
    courseIds: Array.from(courseIdSet),
  }
}
