'use client'

import { useState } from 'react'
import { AdminLesson } from '@/features/admin/services/adminLessons.service'

interface UseInstructorLessonsReturn {
  lessons: AdminLesson[]
  loading: boolean
  error: string | null
  fetchLessons: (moduleId: string, courseId?: string) => Promise<void>
  createLesson: (moduleId: string, data: any, courseId?: string) => Promise<AdminLesson>
  updateLesson: (lessonId: string, data: any, courseId?: string) => Promise<AdminLesson>
  deleteLesson: (lessonId: string, courseId?: string) => Promise<void>
  togglePublished: (lessonId: string, courseId?: string) => Promise<void>
  refetchLessons: (moduleId: string, courseId?: string) => Promise<void>
}

export function useInstructorLessons(courseId?: string): UseInstructorLessonsReturn {
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedModules = new Set<string>()
  const pendingRequests = new Map<string, Promise<void>>()

  // Helper para obtener el courseId correcto
  const getCourseId = (providedCourseId?: string): string => {
    return providedCourseId || courseId || '0'
  }

  // Función de retry con exponential backoff
  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (response.ok) return response
        
        // Solo reintentar en errores 5xx o timeout
        if (i < retries - 1 && (response.status >= 500 || response.status === 429)) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
          continue
        }
        return response
      } catch (err) {
        if (i === retries - 1) throw err
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  const fetchLessons = async (moduleId: string, providedCourseId?: string): Promise<void> => {
    const actualCourseId = getCourseId(providedCourseId)
    const requestKey = `${actualCourseId}-${moduleId}`

    // Evitar requests duplicados
    if (pendingRequests.has(requestKey)) {
      await pendingRequests.get(requestKey)
      return
    }

    // Si ya está cargado, no hacer fetch innecesario
    if (loadedModules.has(requestKey) && lessons.some(l => l.module_id === moduleId)) {
      return
    }

    const requestPromise = (async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithRetry(`/api/instructor/courses/${actualCourseId}/modules/${moduleId}/lessons`)
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Error al obtener lecciones')
          throw new Error(errorText || 'Error al obtener lecciones')
        }

        const data = await response.json()
        
        // Mezclamos con otras lecciones ya cargadas de otros módulos
        const other = lessons.filter(l => l.module_id !== moduleId)
        setLessons([...(data.lessons || []), ...other])
        loadedModules.add(requestKey)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        
        // Solo limpiar lecciones del módulo que falló, no todas
        setLessons(prev => prev.filter(l => l.module_id !== moduleId))
      } finally {
        setLoading(false)
        pendingRequests.delete(requestKey)
      }
    })()

    pendingRequests.set(requestKey, requestPromise)
    await requestPromise
  }

  const refetchLessons = async (moduleId: string, providedCourseId?: string): Promise<void> => {
    const actualCourseId = getCourseId(providedCourseId)
    const requestKey = `${actualCourseId}-${moduleId}`
    loadedModules.delete(requestKey) // Forzar refetch
    await fetchLessons(moduleId, providedCourseId)
  }

  const createLesson = async (moduleId: string, lessonData: any, providedCourseId?: string): Promise<AdminLesson> => {
    const actualCourseId = getCourseId(providedCourseId)
    
    try {
      const response = await fetchWithRetry(`/api/instructor/courses/${actualCourseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al crear lección' }))
        throw new Error(errorData.error || 'Error al crear lección')
      }

      const data = await response.json()
      const newLesson = data.lesson

      // Agregar nueva lección y refetch para asegurar consistencia
      setLessons(prev => [...prev, newLesson])
      await refetchLessons(moduleId, actualCourseId)
      
      return newLesson
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear lección'
      setError(errorMessage)
      throw err
    }
  }

  const updateLesson = async (lessonId: string, lessonData: any, providedCourseId?: string): Promise<AdminLesson> => {
    const actualCourseId = getCourseId(providedCourseId)
    
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      const moduleId = lesson?.module_id
      
      if (!moduleId) throw new Error('ID de módulo no encontrado')

      const response = await fetchWithRetry(`/api/instructor/courses/${actualCourseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar lección' }))
        throw new Error(errorData.error || 'Error al actualizar lección')
      }

      const data = await response.json()
      const updatedLesson = data.lesson

      // Actualizar localmente y refetch para asegurar consistencia
      setLessons(prev => prev.map(l => l.lesson_id === lessonId ? updatedLesson : l))
      await refetchLessons(moduleId, actualCourseId)
      
      return updatedLesson
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar lección'
      setError(errorMessage)
      throw err
    }
  }

  const deleteLesson = async (lessonId: string, providedCourseId?: string): Promise<void> => {
    const actualCourseId = getCourseId(providedCourseId)
    
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      const moduleId = lesson?.module_id
      
      if (!moduleId) throw new Error('ID de módulo no encontrado')

      const response = await fetchWithRetry(`/api/instructor/courses/${actualCourseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar lección' }))
        throw new Error(errorData.error || 'Error al eliminar lección')
      }

      // Eliminar localmente y refetch para asegurar consistencia
      setLessons(prev => prev.filter(l => l.lesson_id !== lessonId))
      await refetchLessons(moduleId, actualCourseId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar lección'
      setError(errorMessage)
      throw err
    }
  }

  const togglePublished = async (lessonId: string, providedCourseId?: string): Promise<void> => {
    try {
      const lesson = lessons.find(l => l.lesson_id === lessonId)
      if (!lesson) throw new Error('Lección no encontrada')

      await updateLesson(lessonId, { is_published: !lesson.is_published }, providedCourseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
      throw err
    }
  }

  return {
    lessons,
    loading,
    error,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    togglePublished,
    refetchLessons
  }
}
