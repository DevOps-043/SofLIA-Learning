'use client'

import { useState } from 'react'
import { AdminMaterial } from '@/features/admin/services/adminMaterials.service'

interface UseInstructorMaterialsReturn {
  materials: AdminMaterial[]
  loading: boolean
  error: string | null
  fetchMaterials: (lessonId: string, courseId: string, moduleId: string) => Promise<void>
  createMaterial: (lessonId: string, courseId: string, moduleId: string, data: Record<string, unknown>) => Promise<AdminMaterial>
  updateMaterial: (materialId: string, courseId: string, moduleId: string, lessonId: string, data: Record<string, unknown>) => Promise<AdminMaterial>
  deleteMaterial: (materialId: string, courseId: string, moduleId: string, lessonId: string) => Promise<void>
}

export function useInstructorMaterials(): UseInstructorMaterialsReturn {
  const [materials, setMaterials] = useState<AdminMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = async (lessonId: string, courseId: string, moduleId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/materials`)
      if (!response.ok) throw new Error('Error al obtener materiales')

      const data = await response.json()
      setMaterials(data.materials || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const createMaterial = async (lessonId: string, courseId: string, moduleId: string, materialData: Record<string, unknown>): Promise<AdminMaterial> => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al crear material')

      const data = await response.json()
      const newMaterial = data.material

      setMaterials(prev => [...prev, newMaterial])
      return newMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear material')
      throw err
    }
  }

  const updateMaterial = async (materialId: string, courseId: string, moduleId: string, lessonId: string, materialData: Record<string, unknown>): Promise<AdminMaterial> => {
    try {
      // Necesitamos crear la ruta de instructor para actualizar materiales
      // Por ahora, usar la ruta de admin pero con validación de instructor
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al actualizar material')

      const data = await response.json()
      const updatedMaterial = data.material

      setMaterials(prev => prev.map(m => m.material_id === materialId ? updatedMaterial : m))
      return updatedMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar material')
      throw err
    }
  }

  const deleteMaterial = async (materialId: string, courseId: string, moduleId: string, lessonId: string): Promise<void> => {
    try {
      // Necesitamos crear la ruta de instructor para eliminar materiales
      // Por ahora, usar la ruta de admin pero con validación de instructor
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/materials/${materialId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar material')

      setMaterials(prev => prev.filter(m => m.material_id !== materialId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar material')
      throw err
    }
  }

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
  }
}

