'use client'

import useSWR from 'swr'

export interface AdminFilterOption {
  value: string
  label: string
}

interface UseAdminUserStatsFiltersReturn {
  companies: AdminFilterOption[]
  courses: AdminFilterOption[]
  learningPaths: AdminFilterOption[]
  isLoading: boolean
}

interface CompaniesResponse {
  companies?: Array<{ id: string; name: string | null }>
}
interface CoursesResponse {
  courses?: Array<{ id: string; title: string | null }>
}
interface LearningPathsResponse {
  learningPaths?: Array<{ id: string; title: string | null }>
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Error al cargar opciones de filtro')
  }
  return response.json() as Promise<T>
}

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
} as const

/**
 * Carga las opciones de los filtros de empresa / curso / learning path del
 * directorio de usuarios del superadministrador. Reutiliza los endpoints admin
 * existentes (`/api/admin/companies`, `/api/admin/courses`, `/api/admin/learning-paths`).
 */
export function useAdminUserStatsFilters(): UseAdminUserStatsFiltersReturn {
  const companiesQuery = useSWR<CompaniesResponse>('/api/admin/companies', fetcher, SWR_OPTIONS)
  const coursesQuery = useSWR<CoursesResponse>('/api/admin/courses', fetcher, SWR_OPTIONS)
  const learningPathsQuery = useSWR<LearningPathsResponse>(
    '/api/admin/learning-paths',
    fetcher,
    SWR_OPTIONS,
  )

  const companies: AdminFilterOption[] = (companiesQuery.data?.companies ?? [])
    .filter((company) => Boolean(company.id))
    .map((company) => ({ value: company.id, label: company.name || company.id }))

  const courses: AdminFilterOption[] = (coursesQuery.data?.courses ?? [])
    .filter((course) => Boolean(course.id))
    .map((course) => ({ value: course.id, label: course.title || course.id }))

  const learningPaths: AdminFilterOption[] = (learningPathsQuery.data?.learningPaths ?? [])
    .filter((path) => Boolean(path.id))
    .map((path) => ({ value: path.id, label: path.title || path.id }))

  return {
    companies,
    courses,
    learningPaths,
    isLoading: companiesQuery.isLoading || coursesQuery.isLoading || learningPathsQuery.isLoading,
  }
}
