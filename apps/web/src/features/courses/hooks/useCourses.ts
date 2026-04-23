'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { useAuth } from '../../auth/hooks/useAuth'
import { CourseWithInstructor } from '../services/course.service'
import {
  COURSES_SWR_OPTIONS,
  coursesFetcher,
  filterCoursesBySelection,
} from './courses-query.utils'

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

interface UseCoursesByCategoryReturn {
  courses: CourseWithInstructor[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCourses(): UseCoursesReturn {
  const [activeFilter, setActiveFilter] = useState('all')
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const { user } = useAuth()
  const url = user?.id ? `/api/courses?userId=${user.id}` : '/api/courses'
  const { data: courses = [], error, isLoading, mutate } = useSWR<CourseWithInstructor[]>(
    url,
    coursesFetcher,
    COURSES_SWR_OPTIONS,
  )

  const filteredCourses = useMemo(
    () => filterCoursesBySelection(courses, activeFilter, userFavorites),
    [courses, activeFilter, userFavorites],
  )

  return {
    courses,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
    filteredCourses,
    setFilter: setActiveFilter,
    activeFilter,
    setFavorites: setUserFavorites,
  }
}

export function useCoursesByCategory(category: string): UseCoursesByCategoryReturn {
  const url = category ? `/api/courses?category=${encodeURIComponent(category)}` : null
  const { data: courses = [], error, isLoading, mutate } = useSWR<CourseWithInstructor[]>(
    url,
    coursesFetcher,
    COURSES_SWR_OPTIONS,
  )

  return {
    courses,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  }
}
