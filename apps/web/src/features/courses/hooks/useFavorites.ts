'use client'

import useSWR from 'swr'

import { useAuth } from '../../auth/hooks/useAuth'
import {
  FAVORITES_SWR_OPTIONS,
  favoritesFetcher,
  getOptimisticFavorites,
  reconcileFavoriteState,
  saveFavoriteToggle,
} from './favorites.utils'

interface UseFavoritesReturn {
  favorites: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (courseId: string) => Promise<boolean>
  isFavorite: (courseId: string) => boolean
  refetch: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth()
  const url = user?.id ? `/api/favorites?userId=${user.id}` : null
  const { data: favorites = [], error, isLoading, mutate } = useSWR<string[]>(
    url,
    favoritesFetcher,
    FAVORITES_SWR_OPTIONS,
  )

  const toggleFavorite = async (courseId: string): Promise<boolean> => {
    if (!user?.id) return false

    const previousFavorites = [...favorites]
    const optimisticFavorites = getOptimisticFavorites(favorites, courseId)
    mutate(optimisticFavorites, false)

    try {
      const result = await saveFavoriteToggle(user.id, courseId)
      reconcileFavoriteState({ courseId, mutate, optimisticFavorites, result })
      return result.isFavorite
    } catch {
      mutate(previousFavorites, false)
      return false
    }
  }

  return {
    favorites,
    loading: isLoading,
    error: error?.message || null,
    toggleFavorite,
    isFavorite: (courseId: string) => favorites.includes(courseId),
    refetch: mutate,
  }
}
