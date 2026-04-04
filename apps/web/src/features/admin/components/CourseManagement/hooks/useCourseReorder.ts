'use client'

import { useState, useEffect, useRef } from 'react'
import type { AdminLesson, CreateLessonData, UpdateLessonData } from '../../../services/adminLessons.service'
import type { AdminModule, CreateModuleData, UpdateModuleData } from '../../../services/adminModules.service'

type ReorderModulesFn = (
  courseId: string,
  modules: Array<{ module_id: string; module_order_index: number }>
) => Promise<void>

type ReorderLessonsFn = (
  moduleId: string,
  lessons: Array<{ lesson_id: string; lesson_order_index: number }>,
  courseId?: string
) => Promise<void>

type FetchLessonsFn = (
  moduleId: string,
  courseId?: string,
  options?: { silent?: boolean }
) => Promise<void>

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
  const [orderedLessons, setOrderedLessons] = useState<Record<string, AdminLesson[]>>({})
  const reorderTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (modules.length > 0) {
      const sorted = [...modules].sort(
        (a, b) => (a.module_order_index || 0) - (b.module_order_index || 0)
      )
      setOrderedModules(sorted)
    } else {
      setOrderedModules([])
    }
  }, [modules])

  useEffect(() => {
    const lessonsByModule: Record<string, AdminLesson[]> = {}
    lessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = []
      }
      lessonsByModule[lesson.module_id].push(lesson)
    })
    Object.keys(lessonsByModule).forEach(moduleId => {
      lessonsByModule[moduleId].sort(
        (a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0)
      )
    })
    setOrderedLessons(lessonsByModule)
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
