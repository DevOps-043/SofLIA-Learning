import type {
  StudyPlannerMyCourseRecord,
  StudyPlannerMyCoursesPayload,
} from './planner-course-workload.types'

export function normalizeCourseCollection(
  payload: StudyPlannerMyCourseRecord[] | StudyPlannerMyCoursesPayload,
): StudyPlannerMyCourseRecord[] {
  return Array.isArray(payload) ? payload : payload.courses || []
}
