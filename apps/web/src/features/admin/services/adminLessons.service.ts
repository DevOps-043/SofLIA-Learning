import {
  createLesson,
  deleteLesson,
  recalculateAllLessonDurations,
  reorderLessons,
  toggleLessonPublished,
  updateLesson,
} from './admin-lessons/mutation.service'
import {
  recalculateLessonDurations,
  updateCourseDuration,
  updateModuleDuration,
} from './admin-lessons/duration.service'
import {
  getLessonById,
  getModuleLessons,
} from './admin-lessons/query.service'

export type {
  AdminLesson,
  CreateLessonData,
  UpdateLessonData,
} from './admin-lessons/types'

export class AdminLessonsService {
  static async getModuleLessons(moduleId: string) {
    return getModuleLessons(moduleId)
  }

  static async getLessonById(lessonId: string) {
    return getLessonById(lessonId)
  }

  static async createLesson(
    moduleId: string,
    lessonData: import('./admin-lessons/types').CreateLessonData,
    userId?: string,
  ) {
    return createLesson(moduleId, lessonData, userId)
  }

  static async updateLesson(
    lessonId: string,
    lessonData: import('./admin-lessons/types').UpdateLessonData,
  ) {
    return updateLesson(lessonId, lessonData)
  }

  static async deleteLesson(lessonId: string) {
    return deleteLesson(lessonId)
  }

  static async reorderLessons(
    moduleId: string,
    lessons: Array<{ lesson_id: string; lesson_order_index: number }>,
  ) {
    void moduleId
    return reorderLessons(lessons)
  }

  static async toggleLessonPublished(lessonId: string) {
    return toggleLessonPublished(lessonId)
  }

  static async updateModuleDuration(moduleId: string) {
    return updateModuleDuration(moduleId)
  }

  static async updateCourseDuration(courseId: string) {
    return updateCourseDuration(courseId)
  }

  static async recalculateLessonDurations(lessonIds: string[]) {
    return recalculateLessonDurations(lessonIds)
  }

  static async recalculateAllLessonDurations() {
    return recalculateAllLessonDurations()
  }
}
