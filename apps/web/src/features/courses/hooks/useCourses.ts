'use client'

import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import { CourseWithInstructor } from '../services/course.service'
import { useAuth } from '../../auth/hooks/useAuth'

interface UseCoursesReturn {
  courses: CourseWithInstructor[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  filteredCourses: CourseWithInstructor[]
  setFilter: (filter: string) => void
  activeFilter: string
  setFavorites: (favorites: string[]) => void
}

// ⚡ Fetcher optimizado para SWR
const coursesFetcher = async (url: string): Promise<CourseWithInstructor[]> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function useCourses(): UseCoursesReturn {
  const [activeFilter, setActiveFilter] = useState('all')
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const { user } = useAuth()

  // ⚡ SWR con cache y deduplicación
  const url = user?.id ? `/api/courses?userId=${user.id}` : '/api/courses'

  const { data: courses = [], error, isLoading, mutate } = useSWR<CourseWithInstructor[]>(
    url,
    coursesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10s deduplication
      refreshInterval: 0,
      shouldRetryOnError: false,
    }
  )

  // Filtrar cursos basado en el filtro activo
  const filteredCourses = useMemo(() => {
    if (activeFilter === 'all') {
      return courses
    }

    if (activeFilter === 'favorites') {
      return courses.filter(course => userFavorites.includes(course.id))
    }

    return courses.filter(course =>
      course.category?.toLowerCase() === activeFilter.toLowerCase()
    )
  }, [courses, activeFilter, userFavorites])

  const setFilter = (filter: string) => {
    setActiveFilter(filter)
  }

  return {
    courses,
    loading: isLoading,
    error: error?.message || null,
    refetch: async () => { await mutate() },
    filteredCourses,
    setFilter,
    activeFilter,
    setFavorites: setUserFavorites
  }
}

interface UseCoursesByCategoryReturn {
  courses: CourseWithInstructor[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCoursesByCategory(category: string): UseCoursesByCategoryReturn {
  // ⚡ SWR con cache y deduplicación
  const url = category ? `/api/courses?category=${encodeURIComponent(category)}` : null

  const { data: courses = [], error, isLoading, mutate } = useSWR<CourseWithInstructor[]>(
    url,
    coursesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      refreshInterval: 0,
      shouldRetryOnError: false,
    }
  )

  return {
    courses,
    loading: isLoading,
    error: error?.message || null,
    refetch: async () => { await mutate() }
  }
}
