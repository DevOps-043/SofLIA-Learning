'use client'

import { useState, useEffect } from 'react'
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
  error: string | null
  refetch: () => Promise<void>
}

const EMPTY_PAGINATION: WorkshopPagination = {
  page: 1,
  limit: 24,
  total: 0,
  totalPages: 0,
}

export function useAdminWorkshops(params: UseAdminWorkshopsParams): UseAdminWorkshopsReturn {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([])
  const [pagination, setPagination] = useState<WorkshopPagination>(EMPTY_PAGINATION)
  const [stats, setStats] = useState<WorkshopStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      })

      const normalizedSearch = params.searchTerm.trim()
      if (normalizedSearch) {
        query.set('search', normalizedSearch)
      }

      if (params.filterCategory !== 'all') {
        query.set('category', params.filterCategory)
      }

      if (params.filterStatus !== 'all') {
        query.set('status', params.filterStatus)
      }

      const [workshopsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/workshops?${query.toString()}`),
        fetch('/api/admin/workshops/stats')
      ])

      if (!workshopsResponse.ok || !statsResponse.ok) {
        throw new Error('Error al cargar los datos de talleres')
      }

      const [workshopsData, statsData] = await Promise.all([
        workshopsResponse.json(),
        statsResponse.json()
      ])

      setWorkshops(workshopsData.workshops || [])
      setPagination(workshopsData.pagination || EMPTY_PAGINATION)
      setStats(statsData.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [
    params.filterCategory,
    params.filterStatus,
    params.limit,
    params.page,
    params.searchTerm,
  ])

  const refetch = async () => {
    await fetchData()
  }

  return {
    workshops,
    pagination,
    stats,
    isLoading,
    error,
    refetch
  }
}
