import { calculateDaysBetween, clampPercentage } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { isCompletedStatus } from './is-completed-status'
import { isOverdueAssignment } from './is-overdue-assignment'
import { organizationAssignmentKey } from './organization-assignment-key'
import { pushLastActivity } from './push-last-activity'
import { recordCompletedCourse } from './record-completed-course'
import { shouldIncludeStateRecord } from './should-include-state-record'
import { unwrapRelation } from './unwrap-relation'
import { updateCourseProgress } from './update-course-progress'
import type { AssignmentRecord } from './assignment-record'
import type { BuildContext } from './build-context'

export function applyAssignments(context: BuildContext, assignments: AssignmentRecord[]): void {
  // Estas filas ya vienen acotadas por organization_id. Registrar primero todo
  // el catalogo evita que el primer curso procesado haga que los siguientes se
  // interpreten incorrectamente como cursos externos a la organizacion.
  assignments.forEach((assignment) => {
    if (assignment.course_id) context.orgCourseIds.add(assignment.course_id)
    if (assignment.user_id && assignment.course_id) {
      context.orgAssignmentKeys.add(
        organizationAssignmentKey(assignment.user_id, assignment.course_id),
      )
    }
  })
  context.orgCourseScopeReady = true

  assignments.forEach((assignment) => {
    if (
      !shouldIncludeStateRecord(context, assignment.user_id, assignment.course_id, [
        assignment.assigned_at,
        assignment.completed_at,
        assignment.due_date,
        assignment.updated_at,
      ])
    ) {
      return
    }

    const user = context.users.get(assignment.user_id)
    if (!user) return

    context.orgCourseIds.add(assignment.course_id)
    const course = ensureCourse(context, assignment.course_id, unwrapRelation(assignment.courses)?.title)
    const progress = clampPercentage(Number(assignment.completion_percentage) || 0)
    const completed = isCompletedStatus(assignment.status) || progress >= 100 || Boolean(assignment.completed_at)

    user.assignedCourseIds.add(assignment.course_id)
    course.assignedUsers.add(assignment.user_id)
    updateCourseProgress(user, course, assignment.user_id, assignment.course_id, progress)

    if (completed) {
      const completionDays = calculateDaysBetween(assignment.assigned_at, assignment.completed_at || assignment.updated_at)
      if (completionDays !== null) {
        const previous = user.completionDaysByCourse.get(assignment.course_id)
        user.completionDaysByCourse.set(
          assignment.course_id,
          previous === undefined ? completionDays : Math.min(previous, completionDays),
        )
      }
      recordCompletedCourse(
        context,
        user,
        course,
        assignment.user_id,
        assignment.course_id,
        assignment.completed_at || assignment.updated_at,
      )
    }

    if (isOverdueAssignment(assignment)) {
      user.overdueCourseIds.add(assignment.course_id)
      course.overdueUsers.add(assignment.user_id)
    }

    // Asignar un curso no es actividad de aprendizaje. Solo una finalizacion o
    // un avance real pueden actualizar la ultima actividad del colaborador.
    pushLastActivity(
      user,
      assignment.completed_at,
      progress > 0 || completed ? assignment.updated_at : null,
    )
  })
}
