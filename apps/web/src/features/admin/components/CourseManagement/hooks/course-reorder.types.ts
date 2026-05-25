import type { AdminLesson } from '../../../services/adminLessons.service'

export type ReorderModulesFn = (
  courseId: string,
  modules: Array<{ module_id: string; module_order_index: number }>,
) => Promise<void>

export type ReorderLessonsFn = (
  moduleId: string,
  lessons: Array<{ lesson_id: string; lesson_order_index: number }>,
  courseId?: string,
) => Promise<void>

export type FetchLessonsFn = (
  moduleId: string,
  courseId?: string,
  options?: { silent?: boolean },
) => Promise<void>

export type OrderedLessonsByModule = Record<string, AdminLesson[]>
