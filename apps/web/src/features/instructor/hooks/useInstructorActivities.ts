'use client'

import { useState } from 'react'
import { AdminActivity } from '@/features/admin/services/adminActivities.service'

interface UseInstructorActivitiesReturn {
  activities: AdminActivity[]
  loading: boolean
  error: string | null
  fetchActivities: (lessonId: string, courseId: string, moduleId: string) => Promise<void>
  createActivity: (lessonId: string, courseId: string, moduleId: string, data: Record<string, unknown>) => Promise<AdminActivity>
  updateActivity: (activityId: string, courseId: string, moduleId: string, lessonId: string, data: Record<string, unknown>) => Promise<AdminActivity>
  deleteActivity: (activityId: string, courseId: string, moduleId: string, lessonId: string) => Promise<void>
}

export function useInstructorActivities(): UseInstructorActivitiesReturn {
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async (lessonId: string, courseId: string, moduleId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/activities`)
      if (!response.ok) throw new Error('Error al obtener actividades')

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const createActivity = async (lessonId: string, courseId: string, moduleId: string, activityData: Record<string, unknown>): Promise<AdminActivity> => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) throw new Error('Error al crear actividad')

      const data = await response.json()
      const newActivity = data.activity

      setActivities(prev => [...prev, newActivity])
      return newActivity
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear actividad')
      throw err
    }
  }

  const updateActivity = async (activityId: string, courseId: string, moduleId: string, lessonId: string, activityData: Record<string, unknown>): Promise<AdminActivity> => {
    try {
      // Necesitamos crear la ruta de instructor para actualizar actividades
      // Por ahora, usar la ruta de admin pero con validación de instructor
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) throw new Error('Error al actualizar actividad')

      const data = await response.json()
      const updatedActivity = data.activity

      setActivities(prev => prev.map(a => a.activity_id === activityId ? updatedActivity : a))
      return updatedActivity
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar actividad')
      throw err
    }
  }

  const deleteActivity = async (activityId: string, courseId: string, moduleId: string, lessonId: string): Promise<void> => {
    try {
      // Necesitamos crear la ruta de instructor para eliminar actividades
      // Por ahora, usar la ruta de admin pero con validación de instructor
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/activities/${activityId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar actividad')

      setActivities(prev => prev.filter(a => a.activity_id !== activityId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar actividad')
      throw err
    }
  }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity
  }
}

