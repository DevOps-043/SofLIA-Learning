'use client'

import { useState, useEffect, useRef } from 'react'
import type { AdminLesson } from '../../../services/adminLessons.service'
import type { AdminModule } from '../../../services/adminModules.service'
import { groupLessonsByModule, sortModulesByOrder } from './course-reorder.sorting'
import type {
  FetchLessonsFn,
  OrderedLessonsByModule,
  ReorderLessonsFn,
  ReorderModulesFn,
} from './course-reorder.types'

export function useCourseReorder(
  courseId: string,
  modules: AdminModule[],
  lessons: AdminLesson[],
  reorderModules: ReorderModulesFn,
  reorderLessons: ReorderLessonsFn,
  fetchLessons: FetchLessonsFn,
  showFeedback: (type: 'success' | 'error', message: string) => void
) {
  const [orderedModules, setOrderedModules] = useState<AdminModule[]>([])
  const [orderedLessons, setOrderedLessons] = useState<OrderedLessonsByModule>({})
  const reorderTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (modules.length > 0) {
      setOrderedModules(sortModulesByOrder(modules))
    } else {
      setOrderedModules([])
    }
  }, [modules])

  useEffect(() => {
    setOrderedLessons(groupLessonsByModule(lessons))
  }, [lessons])

  const handleModulesReorder = (newOrder: AdminModule[]) => {
    setOrderedModules(newOrder)

    if (reorderTimeoutRef.current['modules']) {
      clearTimeout(reorderTimeoutRef.current['modules'])
    }

    reorderTimeoutRef.current['modules'] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((mod, index) => ({
          module_id: mod.module_id,
          module_order_index: index + 1,
        }))
        await reorderModules(courseId, reorderData)
        showFeedback('success', 'Orden de módulos guardado')
      } catch {
        showFeedback('error', 'Error al guardar el orden de los módulos')
        setOrderedModules(modules)
      }
    }, 1000)
  }

  const handleLessonsReorder = (moduleId: string, newOrder: AdminLesson[]) => {
    setOrderedLessons(prev => ({ ...prev, [moduleId]: newOrder }))

    const key = `lessons-${moduleId}`
    if (reorderTimeoutRef.current[key]) {
      clearTimeout(reorderTimeoutRef.current[key])
    }

    reorderTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((lesson, index) => ({
          lesson_id: lesson.lesson_id,
          lesson_order_index: index + 1,
        }))
        await reorderLessons(moduleId, reorderData, courseId)
        showFeedback('success', 'Orden de lecciones guardado')
      } catch {
        showFeedback('error', 'Error al guardar el orden de las lecciones')
        fetchLessons(moduleId, courseId)
      }
    }, 1000)
  }

  return {
    orderedModules,
    orderedLessons,
    handleModulesReorder,
    handleLessonsReorder,
  }
}
