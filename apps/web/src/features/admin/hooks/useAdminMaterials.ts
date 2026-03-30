'use client'

import { useState } from 'react'
import { AdminMaterial } from '../services/adminMaterials.service'

interface UseAdminMaterialsReturn {
  materials: AdminMaterial[] // Para compatibilidad
  getMaterialsByLesson: (lessonId: string) => AdminMaterial[] // Nueva función helper
  loading: boolean
  error: string | null
  fetchMaterials: (lessonId: string) => Promise<void>
  createMaterial: (lessonId: string, data: any) => Promise<AdminMaterial>
  updateMaterial: (materialId: string, data: any) => Promise<AdminMaterial>
  deleteMaterial: (materialId: string) => Promise<void>
}

export function useAdminMaterials(): UseAdminMaterialsReturn {
  // Cambiar a un Map para almacenar materiales por lección
  const [materialsByLesson, setMaterialsByLesson] = useState<Map<string, AdminMaterial[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener todos los materiales combinados para compatibilidad
  const materials = Array.from(materialsByLesson.values()).flat()

  const fetchMaterials = async (lessonId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials`)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Error al obtener materiales: ${response.status}`)
      }

      const data = await response.json()
      const materialsData = data.materials || data || [];
      
      
      // Actualizar el Map con los materiales de esta lección específica
      setMaterialsByLesson(prev => {
        const newMap = new Map(prev)
        newMap.set(lessonId, materialsData)
        return newMap
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // No limpiar todos los materiales, solo los de esta lección
      setMaterialsByLesson(prev => {
        const newMap = new Map(prev)
        newMap.set(lessonId, [])
        return newMap
      })
    } finally {
      setLoading(false)
    }
  }

  const createMaterial = async (lessonId: string, materialData: any): Promise<AdminMaterial> => {
    try {
      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al crear material')

      const data = await response.json()
      const newMaterial = data.material

      // Agregar el material a la lección correspondiente
      setMaterialsByLesson(prev => {
        const newMap = new Map(prev)
        const currentMaterials = newMap.get(lessonId) || []
        newMap.set(lessonId, [...currentMaterials, newMaterial])
        return newMap
      })
      
      return newMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear material')
      throw err
    }
  }

  const updateMaterial = async (materialId: string, materialData: any): Promise<AdminMaterial> => {
    try {
      // Buscar la lección que contiene este material
      let lessonId: string | null = null;
      materialsByLesson.forEach((mats, lid) => {
        if (mats.some(m => m.material_id === materialId)) {
          lessonId = lid;
        }
      });

      if (!lessonId) {
        throw new Error('No se encontró la lección del material');
      }

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      })

      if (!response.ok) throw new Error('Error al actualizar material')

      const data = await response.json()
      const updatedMaterial = data.material

      // Actualizar el material en la lección correspondiente
      setMaterialsByLesson(prev => {
        const newMap = new Map(prev)
        const currentMaterials = newMap.get(lessonId!) || []
        newMap.set(lessonId!, currentMaterials.map(m => m.material_id === materialId ? updatedMaterial : m))
        return newMap
      })
      
      return updatedMaterial
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar material')
      throw err
    }
  }

  const deleteMaterial = async (materialId: string): Promise<void> => {
    try {
      // Buscar la lección que contiene este material
      let lessonId: string | null = null;
      materialsByLesson.forEach((mats, lid) => {
        if (mats.some(m => m.material_id === materialId)) {
          lessonId = lid;
        }
      });

      if (!lessonId) {
        throw new Error('No se encontró la lección del material');
      }

      const response = await fetch(`/api/admin/courses/0/modules/0/lessons/${lessonId}/materials/${materialId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar material')

      // Eliminar el material de la lección correspondiente
      setMaterialsByLesson(prev => {
        const newMap = new Map(prev)
        const currentMaterials = newMap.get(lessonId!) || []
        newMap.set(lessonId!, currentMaterials.filter(m => m.material_id !== materialId))
        return newMap
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar material')
      throw err
    }
  }

  // Función helper para obtener materiales de una lección específica
  // No usar useCallback para que siempre acceda al estado más reciente
  const getMaterialsByLesson = (lessonId: string): AdminMaterial[] => {
    return materialsByLesson.get(lessonId) || []
  }

  return {
    materials, // Para compatibilidad con código existente
    getMaterialsByLesson, // Nueva función para obtener materiales por lección
    loading,
    error,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
  }
}

