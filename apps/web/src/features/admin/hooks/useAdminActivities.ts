'use client'

import { useState } from 'react'
import { AdminActivity } from '../services/adminActivities.service'

interface UseAdminActivitiesReturn {
  activities: AdminActivity[] // Para compatibilidad
  getActivitiesByLesson: (lessonId: string) => AdminActivity[] // Nueva función helper
  loading: boolean
  error: string | null
  fetchActivities: (lessonId: string) => Promise<void>
  createActivity: (lessonId: string, data: any) => Promise<AdminActivity>
  updateActivity: (activityId: string, data: any) => Promise<AdminActivity>
  deleteActivity: (activityId: string) => Promise<void>
}

export function useAdminActivities(): UseAdminActivitiesReturn {
  // Cambiar a un Map para almacenar actividades por lección
  const [activitiesByLesson, setActivitiesByLesson] = useState<Map<string, AdminActivity[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener todas las actividades combinadas para compatibilidad
  const activities = Array.from(activitiesByLesson.values()).flat()

  const fetchActivities = async (lessonId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/activities`)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Error al obtener actividades: ${response.status}`)
      }

      const data = await response.json()
      const activitiesData = data.activities || data || [];
      
      
      // Actualizar el Map con las actividades de esta lección específica
      setActivitiesByLesson(prev => {
        const newMap = new Map(prev)
        newMap.set(lessonId, activitiesData)
        return newMap
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // No limpiar todas las actividades, solo las de esta lección
      setActivitiesByLesson(prev => {
        const newMap = new Map(prev)
        newMap.set(lessonId, [])
        return newMap
      })
    } finally {
      setLoading(false)
    }
  }

  const createActivity = async (lessonId: string, activityData: any): Promise<AdminActivity> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) throw new Error('Error al crear actividad')

      const data = await response.json()
      const newActivity = data.activity

      // Agregar la actividad a la lección correspondiente
      setActivitiesByLesson(prev => {
        const newMap = new Map(prev)
        const currentActivities = newMap.get(lessonId) || []
        newMap.set(lessonId, [...currentActivities, newActivity])
        return newMap
      })
      
      return newActivity
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear actividad')
      throw err
    }
  }

  const updateActivity = async (activityId: string, activityData: any): Promise<AdminActivity> => {
    try {
      // Buscar la lección que contiene esta actividad
      let lessonId: string | null = null;
      activitiesByLesson.forEach((acts, lid) => {
        if (acts.some(a => a.activity_id === activityId)) {
          lessonId = lid;
        }
      });

      if (!lessonId) {
        throw new Error('No se encontró la lección de la actividad');
      }

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (!response.ok) throw new Error('Error al actualizar actividad')

      const data = await response.json()
      const updatedActivity = data.activity

      // Actualizar la actividad en la lección correspondiente
      setActivitiesByLesson(prev => {
        const newMap = new Map(prev)
        const currentActivities = newMap.get(lessonId!) || []
        newMap.set(lessonId!, currentActivities.map(a => a.activity_id === activityId ? updatedActivity : a))
        return newMap
      })
      
      return updatedActivity
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar actividad')
      throw err
    }
  }

  const deleteActivity = async (activityId: string): Promise<void> => {
    try {
      // Buscar la lección que contiene esta actividad
      let lessonId: string | null = null;
      activitiesByLesson.forEach((acts, lid) => {
        if (acts.some(a => a.activity_id === activityId)) {
          lessonId = lid;
        }
      });

      if (!lessonId) {
        throw new Error('No se encontró la lección de la actividad');
      }

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/activities/${activityId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar actividad')

      // Eliminar la actividad de la lección correspondiente
      setActivitiesByLesson(prev => {
        const newMap = new Map(prev)
        const currentActivities = newMap.get(lessonId!) || []
        newMap.set(lessonId!, currentActivities.filter(a => a.activity_id !== activityId))
        return newMap
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar actividad')
      throw err
    }
  }

  // Función helper para obtener actividades de una lección específica
  // No usar useCallback para que siempre acceda al estado más reciente
  const getActivitiesByLesson = (lessonId: string): AdminActivity[] => {
    return activitiesByLesson.get(lessonId) || []
  }

  return {
    activities, // Para compatibilidad con código existente
    getActivitiesByLesson, // Nueva función para obtener actividades por lección
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity
  }
}

