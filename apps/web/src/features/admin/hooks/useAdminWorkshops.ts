'use client'

import useSWR from 'swr'
import { AdminWorkshop, WorkshopStats } from '../services/adminWorkshops.service'

interface WorkshopPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UseAdminWorkshopsParams {
  page: number
  limit: number
  searchTerm: string
  filterCategory: string
  filterStatus: string
}

interface UseAdminWorkshopsReturn {
  workshops: AdminWorkshop[]
  pagination: WorkshopPagination
  stats: WorkshopStats | null
  isLoading: boolean
  isValidating: boolean
  hasLoadedData: boolean
  error: string | null
  refetch: () => Promise<void>
}

const EMPTY_PAGINATION: WorkshopPagination = {
  page: 1,
  limit: 24,
  total: 0,
  totalPages: 0,
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Error al cargar los datos de talleres')
  return response.json()
}

export function useAdminWorkshops(params: UseAdminWorkshopsParams): UseAdminWorkshopsReturn {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  const search = params.searchTerm.trim()
  if (search) query.set('search', search)
  if (params.filterCategory !== 'all') query.set('category', params.filterCategory)
  if (params.filterStatus !== 'all') query.set('status', params.filterStatus)

  // Separate keys keep global stats stable and prevent older searches from
  // overwriting the latest results when responses arrive out of order.
  const options = { keepPreviousData: true, revalidateOnFocus: false }
  const directory = useSWR<{ workshops: AdminWorkshop[]; pagination: WorkshopPagination }>(
    `/api/admin/workshops?${query}`, fetcher, options,
  )
  const statistics = useSWR<{ stats: WorkshopStats }>('/api/admin/workshops/stats', fetcher, options)
  const error = directory.error || statistics.error
  const hasLoadedData = directory.data !== undefined

  return {
    workshops: directory.data?.workshops ?? [],
    pagination: directory.data?.pagination ?? EMPTY_PAGINATION,
    stats: statistics.data?.stats ?? null,
    isLoading: !hasLoadedData && (directory.isLoading || statistics.isLoading),
    isValidating: directory.isValidating || statistics.isValidating,
    hasLoadedData,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await Promise.all([directory.mutate(), statistics.mutate()]) },
  }
}
