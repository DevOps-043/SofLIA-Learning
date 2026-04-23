type FavoriteToggleResponse = {
  isFavorite: boolean
  favorites?: unknown
}

type ReconcileFavoriteStateParams = {
  courseId: string
  mutate: (data?: string[] | Promise<string[]>, shouldRevalidate?: boolean) => Promise<string[] | undefined>
  optimisticFavorites: string[]
  result: FavoriteToggleResponse
}

export const FAVORITES_SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  refreshInterval: 0,
  shouldRetryOnError: false,
  fallbackData: [],
}

export const favoritesFetcher = async (url: string): Promise<string[]> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    if (response.status === 500) return []
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function getOptimisticFavorites(favorites: string[], courseId: string) {
  return favorites.includes(courseId)
    ? favorites.filter((id) => id !== courseId)
    : [...favorites, courseId]
}

export async function saveFavoriteToggle(userId: string, courseId: string) {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId }),
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }

  return (await response.json()) as FavoriteToggleResponse
}

export function reconcileFavoriteState({
  courseId,
  mutate,
  optimisticFavorites,
  result,
}: ReconcileFavoriteStateParams) {
  if (Array.isArray(result.favorites)) {
    mutate(result.favorites as string[], false)
    return
  }

  const currentInOptimistic = optimisticFavorites.includes(courseId)
  if (currentInOptimistic !== result.isFavorite) {
    mutate(getOptimisticFavorites(optimisticFavorites, courseId), false)
    return
  }

  mutate().catch(() => undefined)
}
