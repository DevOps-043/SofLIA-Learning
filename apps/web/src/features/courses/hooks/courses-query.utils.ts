import type { CourseWithInstructor } from '../services/course.service'

export const COURSES_SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  refreshInterval: 0,
  shouldRetryOnError: false,
}

export const coursesFetcher = async (url: string): Promise<CourseWithInstructor[]> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function filterCoursesBySelection(
  courses: CourseWithInstructor[],
  activeFilter: string,
  userFavorites: string[],
) {
  if (activeFilter === 'all') return courses
  if (activeFilter === 'favorites') {
    return courses.filter((course) => userFavorites.includes(course.id))
  }

  return courses.filter(
    (course) => course.category?.toLowerCase() === activeFilter.toLowerCase(),
  )
}
