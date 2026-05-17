import type {
  BusinessUserStatsInstructorRecord,
  BusinessUserStatsLessonCountRecord,
  BusinessUserStatsLessonProgressRecord,
  BusinessUserStatsLessonRecord,
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsOrganizationUserRecord,
} from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export type InstructorMap = Map<string, { name: string; username: string | null }>

export function getUserProfile(
  organizationUser: BusinessUserStatsOrganizationUserRecord,
) {
  const user = unwrapRelation(organizationUser.users)

  if (!user) {
    throw new Error('No se encontro el perfil del usuario')
  }

  return user
}

export function createLessonInfoById(records: BusinessUserStatsLessonRecord[]) {
  return records.reduce((map, record) => {
    map.set(record.lesson_id, record)
    return map
  }, new Map<string, BusinessUserStatsLessonRecord>())
}

export function createCourseModuleIdsByCourse(
  records: BusinessUserStatsCourseModuleRecord[],
) {
  const map = new Map<string, string[]>()

  records.forEach((record) => {
    const moduleIds = map.get(record.course_id)
    if (moduleIds) {
      moduleIds.push(record.module_id)
    } else {
      map.set(record.course_id, [record.module_id])
    }
  })

  return map
}

export function createRealLessonsByCourse(
  courseModuleIdsByCourse: Map<string, string[]>,
  lessonCounts: BusinessUserStatsLessonCountRecord[],
) {
  const lessonCountByModule = lessonCounts.reduce((map, record) => {
    map.set(record.module_id, (map.get(record.module_id) || 0) + 1)
    return map
  }, new Map<string, number>())

  return Array.from(courseModuleIdsByCourse.entries()).reduce(
    (map, [courseId, moduleIds]) => {
      const lessonCount = moduleIds.reduce(
        (sum, moduleId) => sum + (lessonCountByModule.get(moduleId) || 0),
        0,
      )
      map.set(courseId, lessonCount)
      return map
    },
    new Map<string, number>(),
  )
}

export function createInstructorMap(records: BusinessUserStatsInstructorRecord[]) {
  return records.reduce((map, instructor) => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
    map.set(instructor.id, {
      name: fullName || instructor.username || 'Instructor',
      username: instructor.username,
    })
    return map
  }, new Map<string, { name: string; username: string | null }>())
}

export function createCourseIdByLessonId(
  progressRecords: BusinessUserStatsLessonProgressRecord[],
) {
  const courseIdByLessonId = new Map<string, string>()
  progressRecords.forEach((progress) => {
    const enrollment = unwrapRelation(progress.user_course_enrollments)
    if (progress.lesson_id && enrollment?.course_id) {
      courseIdByLessonId.set(progress.lesson_id, enrollment.course_id)
    }
  })
  return courseIdByLessonId
}
