'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { NewsService, NewsWithMetrics, NewsFilters } from '../services/news.service'

interface UseNewsReturn {
  news: NewsWithMetrics[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useNews(filters: NewsFilters = {}): UseNewsReturn {
  const [news, setNews] = useState<NewsWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchNews = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      }
      
      setError(null)
      
      const currentOffset = reset ? 0 : offset
      const newsData = await NewsService.getPublishedNews({
        ...filters,
        limit: 10,
        offset: currentOffset
      })

      if (reset) {
        setNews(newsData)
      } else {
        setNews(prev => [...prev, ...newsData])
      }

      setHasMore(newsData.length === 10)
      setOffset(currentOffset + newsData.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters, offset])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchNews(false)
    }
  }, [loading, hasMore, fetchNews])

  const refetch = useCallback(async () => {
    await fetchNews(true)
  }, [fetchNews])

  useEffect(() => {
    fetchNews(true)
  }, [filters.status, filters.language])

  return {
    news,
    loading,
    error,
    refetch,
    loadMore,
    hasMore
  }
}

interface UseNewsDetailReturn {
  news: NewsWithMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 🚀 OPTIMIZACIÓN: Migrado a SWR para caching automático
const newsDetailFetcher = async (url: string) => {
  const slug = url.split('/').pop()!
  const newsData = await NewsService.getNewsBySlug(slug)

  // Incrementar contador de vistas (solo en el fetcher inicial)
  if (newsData) {
    NewsService.incrementViewCount(slug).catch(() => {}) // Fire and forget
  }

  return newsData
}

export function useNewsDetail(slug: string): UseNewsDetailReturn {
  const { data: news, error, isLoading, mutate } = useSWR<NewsWithMetrics>(
    slug ? `/news/detail/${slug}` : null,
    newsDetailFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 0, // No auto-refresh for detail view
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: false,
    }
  )

  return {
    news: news ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await mutate() }
  }
}

interface UseNewsStatsReturn {
  stats: {
    totalNews: number
    totalCategories: number
    totalViews: number
  } | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 🚀 OPTIMIZACIÓN: Migrado a SWR para caching automático
const newsStatsFetcher = async () => {
  return await NewsService.getNewsStats()
}

export function useNewsStats(): UseNewsStatsReturn {
  const { data: stats, error, isLoading, mutate } = useSWR(
    '/news/stats',
    newsStatsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,     // 1 minuto
      refreshInterval: 300000,     // Auto-refresh cada 5 minutos
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    }
  )

  return {
    stats: stats ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await mutate() }
  }
}

interface UseFeaturedNewsReturn {
  featuredNews: NewsWithMetrics[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 🚀 OPTIMIZACIÓN: Migrado a SWR para caching automático
const featuredNewsFetcher = async (url: string) => {
  const limit = parseInt(url.split('=')[1] || '3')
  return await NewsService.getFeaturedNews(limit)
}

export function useFeaturedNews(limit: number = 3): UseFeaturedNewsReturn {
  const { data: featuredNews, error, isLoading, mutate } = useSWR<NewsWithMetrics[]>(
    `/news/featured?limit=${limit}`,
    featuredNewsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,      // 1 minuto
      refreshInterval: 300000,      // Auto-refresh cada 5 minutos
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    }
  )

  return {
    featuredNews: featuredNews ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await mutate() }
  }
}
