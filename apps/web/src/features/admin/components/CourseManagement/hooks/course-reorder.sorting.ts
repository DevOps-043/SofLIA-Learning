import type { AdminLesson } from '../../../services/adminLessons.service'
import type { AdminModule } from '../../../services/adminModules.service'
import type { OrderedLessonsByModule } from './course-reorder.types'

export function sortModulesByOrder(modules: AdminModule[]): AdminModule[] {
  return [...modules].sort(
    (left, right) => (left.module_order_index || 0) - (right.module_order_index || 0),
  )
}

export function groupLessonsByModule(lessons: AdminLesson[]): OrderedLessonsByModule {
  const lessonsByModule: OrderedLessonsByModule = {}

  lessons.forEach((lesson) => {
    if (!lessonsByModule[lesson.module_id]) {
      lessonsByModule[lesson.module_id] = []
    }
    lessonsByModule[lesson.module_id].push(lesson)
  })

  Object.keys(lessonsByModule).forEach((moduleId) => {
    lessonsByModule[moduleId].sort(
      (left, right) => (left.lesson_order_index || 0) - (right.lesson_order_index || 0),
    )
  })

  return lessonsByModule
}
