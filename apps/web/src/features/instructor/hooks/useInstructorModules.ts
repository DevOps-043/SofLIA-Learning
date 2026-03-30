'use client'

import { useState } from 'react'
import { AdminModule } from '@/features/admin/services/adminModules.service'

interface UseInstructorModulesReturn {
  modules: AdminModule[]
  loading: boolean
  error: string | null
  fetchModules: (courseId: string) => Promise<void>
  createModule: (courseId: string, data: any) => Promise<AdminModule>
  updateModule: (courseId: string, moduleId: string, data: any) => Promise<AdminModule>
  deleteModule: (courseId: string, moduleId: string) => Promise<void>
  togglePublished: (courseId: string, moduleId: string) => Promise<void>
}

export function useInstructorModules(): UseInstructorModulesReturn {
  const [modules, setModules] = useState<AdminModule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const fetchModules = async (courseId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchWithRetry(`/api/instructor/courses/${courseId}/modules`)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error al obtener módulos')
        throw new Error(errorText || 'Error al obtener módulos')
      }

      const data = await response.json()
      setModules(data.modules || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      // No limpiar todos los módulos en caso de error, mantener los existentes
    } finally {
      setLoading(false)
    }
  }

  const createModule = async (courseId: string, moduleData: any): Promise<AdminModule> => {
    try {
      const response = await fetchWithRetry(`/api/instructor/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al crear módulo' }))
        throw new Error(errorData.error || 'Error al crear módulo')
      }

      const data = await response.json()
      const newModule = data.module

      // Agregar nuevo módulo y refetch para asegurar consistencia
      setModules(prev => [...prev, newModule])
      await fetchModules(courseId)
      
      return newModule
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear módulo'
      setError(errorMessage)
      throw err
    }
  }

  const updateModule = async (courseId: string, moduleId: string, moduleData: any): Promise<AdminModule> => {
    try {
      const response = await fetchWithRetry(`/api/instructor/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar módulo' }))
        throw new Error(errorData.error || 'Error al actualizar módulo')
      }

      const data = await response.json()
      const updatedModule = data.module

      // Actualizar localmente y refetch para asegurar consistencia
      setModules(prev => prev.map(m => m.module_id === moduleId ? updatedModule : m))
      await fetchModules(courseId)
      
      return updatedModule
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar módulo'
      setError(errorMessage)
      throw err
    }
  }

  const deleteModule = async (courseId: string, moduleId: string): Promise<void> => {
    try {
      const response = await fetchWithRetry(`/api/instructor/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar módulo' }))
        throw new Error(errorData.error || 'Error al eliminar módulo')
      }

      // Eliminar localmente y refetch para asegurar consistencia
      setModules(prev => prev.filter(m => m.module_id !== moduleId))
      await fetchModules(courseId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar módulo'
      setError(errorMessage)
      throw err
    }
  }

  const togglePublished = async (courseId: string, moduleId: string): Promise<void> => {
    try {
      const module = modules.find(m => m.module_id === moduleId)
      if (!module) throw new Error('Módulo no encontrado')

      await updateModule(courseId, moduleId, { is_published: !module.is_published })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
      throw err
    }
  }

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    togglePublished
  }
}
