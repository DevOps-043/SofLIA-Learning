import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'

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

interface BusinessCoursesResponse {
  success?: boolean
  courses?: BusinessCourse[]
  error?: string
}

const EMPTY_STATS: BusinessCoursesStats = {
  total: 0,
  byCategory: {},
  byLevel: {},
}

function calculateBusinessCoursesStats(courses: BusinessCourse[]): BusinessCoursesStats {
  const byCategory: Record<string, number> = {}
  const byLevel: Record<string, number> = {}

  for (const course of courses) {
    const category = course.category || 'Sin categoria'
    const level = course.level || 'Sin nivel'
    byCategory[category] = (byCategory[category] || 0) + 1
    byLevel[level] = (byLevel[level] || 0) + 1
  }

  return {
    total: courses.length,
    byCategory,
    byLevel,
  }
}

async function fetchBusinessCourses(url: string): Promise<BusinessCourse[]> {
  const response = await fetch(url, {
    credentials: 'include',
  })
  const payload = (await response.json().catch(() => null)) as BusinessCoursesResponse | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Error al obtener cursos')
  }

  return payload.courses || []
}

/**
 * Hook para obtener cursos disponibles para la organizacion.
 *
 * Usa SWR para conservar datos previos entre navegaciones y evitar loaders
 * completos cuando el usuario vuelve a una ruta ya visitada.
 */
export function useBusinessCourses() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const swrKey = orgSlug ? `/api/${orgSlug}/business/courses` : null

  const {
    data: courses = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<BusinessCourse[]>(swrKey, fetchBusinessCourses, {
    dedupingInterval: 60000,
    errorRetryCount: 1,
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const stats = useMemo(
    () => courses.length > 0 ? calculateBusinessCoursesStats(courses) : EMPTY_STATS,
    [courses],
  )

  return {
    courses,
    stats,
    isLoading: Boolean(swrKey) && isLoading && courses.length === 0,
    isValidating,
    error: !orgSlug
      ? 'No se pudo determinar la organizacion'
      : error instanceof Error
        ? error.message
        : null,
    refetch: mutate,
  }
}
