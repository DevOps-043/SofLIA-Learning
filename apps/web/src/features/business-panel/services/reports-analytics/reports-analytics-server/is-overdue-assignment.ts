import { isCompletedStatus } from './is-completed-status'
import type { AssignmentRecord } from './assignment-record'

export function isOverdueAssignment(assignment: AssignmentRecord): boolean {
  if (!assignment.due_date) return false
  if (isCompletedStatus(assignment.status) || assignment.completed_at) return false
  return new Date(assignment.due_date) < new Date()
}
