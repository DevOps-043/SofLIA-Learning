import { AssignmentRecord } from './assignment-record'
import { unwrapRelation } from './unwrap-relation'

export function buildCourseTitleMap(assignments: AssignmentRecord[]): Map<string, string> {
  const map = new Map<string, string>()
  assignments.forEach((assignment) => {
    const course = unwrapRelation(assignment.courses)
    map.set(assignment.course_id, course?.title || assignment.course_id)
  })
  return map
}
