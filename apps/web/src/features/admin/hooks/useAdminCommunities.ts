'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminCommunity, CommunityStats } from '../services/adminCommunities.service'

interface UseAdminCommunitiesReturn {
  communities: AdminCommunity[]
  stats: CommunityStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

function normalizeCommunitiesPayload(payload: unknown): AdminCommunity[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const result = payload as { communities?: AdminCommunity[]; data?: AdminCommunity[] }
  return result.communities || result.data || []
}

export function useAdminCommunities(): UseAdminCommunitiesReturn {
  const [communities, setCommunities] = useState<AdminCommunity[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [communitiesResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/communities?paginated=false'),
        fetch('/api/admin/communities/stats')
      ])

      if (!communitiesResponse.ok || !statsResponse.ok) {
        throw new Error('Error al cargar los datos de comunidades')
      }

      const [communitiesData, statsData] = await Promise.all([
        communitiesResponse.json(),
        statsResponse.json()
      ])

      setCommunities(normalizeCommunitiesPayload(communitiesData))
      setStats((statsData as { stats?: CommunityStats }).stats || null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    communities,
    stats,
    isLoading,
    error,
    refetch: () => { void fetchData() }
  }
}

interface UseCommunitiesPaginatedParams {
  search?: string
  visibility?: string
  isActive?: boolean
  limit?: number
}

interface PaginatedCommunitiesPage {
  data: AdminCommunity[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

export function useCommunitiesPaginated(params: UseCommunitiesPaginatedParams = {}) {
  const { search, visibility, isActive, limit = 20 } = params
  const [pages, setPages] = useState<PaginatedCommunitiesPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFirstPage = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const query = new URLSearchParams({
        limit: limit.toString(),
        ...(search ? { search } : {}),
        ...(visibility ? { visibility } : {}),
        ...(isActive !== undefined ? { isActive: String(isActive) } : {})
      })

      const response = await fetch(`/api/admin/communities?${query}`)
      if (!response.ok) {
        throw new Error('Error al cargar comunidades')
      }

      const result = await response.json() as PaginatedCommunitiesPage
      setPages([result])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [isActive, limit, search, visibility])

  useEffect(() => {
    setPages([])
    void fetchFirstPage()
  }, [fetchFirstPage])

  const fetchNextPage = async () => {
    if (isFetchingNextPage || pages.length === 0 || !pages[pages.length - 1].hasMore) {
      return
    }

    try {
      setIsFetchingNextPage(true)
      setError(null)

      const lastPage = pages[pages.length - 1]
      const query = new URLSearchParams({
        limit: limit.toString(),
        cursor: lastPage.nextCursor || '',
        ...(search ? { search } : {}),
        ...(visibility ? { visibility } : {}),
        ...(isActive !== undefined ? { isActive: String(isActive) } : {})
      })

      const response = await fetch(`/api/admin/communities?${query}`)
      if (!response.ok) {
        throw new Error('Error al cargar mas comunidades')
      }

      const result = await response.json() as PaginatedCommunitiesPage
      setPages(previous => [...previous, result])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
    } finally {
      setIsFetchingNextPage(false)
    }
  }

  return {
    communities: pages.flatMap(page => page.data),
    total: pages[0]?.total || 0,
    isLoading,
    isFetchingNextPage,
    hasNextPage: pages.length > 0 && pages[pages.length - 1].hasMore,
    error,
    fetchNextPage,
    refetch: () => {
      setPages([])
      void fetchFirstPage()
    }
  }
}
