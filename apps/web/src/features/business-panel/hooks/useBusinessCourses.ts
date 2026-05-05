import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

export interface BusinessCourse {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor: {
    id: string
    name: string
    email: string
  }
  duration: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  rating: number
  student_count: number
  review_count: number
  learning_objectives: string[] | null
  created_at: string
  updated_at: string
}

export interface BusinessCoursesStats {
  total: number
  byCategory: Record<string, number>
  byLevel: Record<string, number>
}

/**
 * Hook para obtener cursos disponibles para la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useBusinessCourses() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [courses, setCourses] = useState<BusinessCourse[]>([])
  const [stats, setStats] = useState<BusinessCoursesStats>({
    total: 0,
    byCategory: {},
    byLevel: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/courses`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.courses) {
        setCourses(data.courses)

        // Calcular estadísticas
        const byCategory: Record<string, number> = {}
        const byLevel: Record<string, number> = {}

        data.courses.forEach((course: BusinessCourse) => {
          // Por categoría
          const category = course.category || 'Sin categoría'
          byCategory[category] = (byCategory[category] || 0) + 1

          // Por nivel
          const level = course.level || 'Sin nivel'
          byLevel[level] = (byLevel[level] || 0) + 1
        })

        setStats({
          total: data.courses.length,
          byCategory,
          byLevel
        })
      } else {
        throw new Error(data.error || 'Error al obtener cursos')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return {
    courses,
    stats,
    isLoading,
    error,
    refetch: fetchCourses
  }
}
