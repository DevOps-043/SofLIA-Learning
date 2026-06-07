'use client'

import useSWR from 'swr'

interface Category {
  id: string
  name: string
  active: boolean
}

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// ⚡ Fetcher optimizado para SWR
const categoriesFetcher = async (url: string): Promise<Category[]> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  const data: string[] = await response.json()

  // Crear categorías dinámicas basadas en los datos de la API
  const dynamicCategories: Category[] = [
    { id: 'all', name: 'Todos', active: true },
    { id: 'favorites', name: 'Favoritos', active: false },
    ...data.map(category => ({
      id: category.toLowerCase(),
      name: category,
      active: false
    }))
  ]

  return dynamicCategories
}

// Categorías por defecto como fallback
const defaultCategories: Category[] = [
  { id: 'all', name: 'Todos', active: true },
  { id: 'favorites', name: 'Favoritos', active: false },
  { id: 'ia', name: 'IA', active: false },
  { id: 'datos', name: 'Datos', active: false },
  { id: 'desarrollo', name: 'Desarrollo', active: false },
  { id: 'diseno', name: 'Diseño', active: false },
  { id: 'it', name: 'IT & Software', active: false },
  { id: 'marketing', name: 'Marketing', active: false },
  { id: 'negocios', name: 'Negocios', active: false },
]

export function useCategories(): UseCategoriesReturn {
  // ⚡ SWR con cache y deduplicación de 60s - categorías cambian raramente
  const { data: categories = defaultCategories, error, isLoading, mutate } = useSWR<Category[]>(
    '/api/categories',
    categoriesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60s deduplication - categorías son muy estables
      refreshInterval: 0,
      shouldRetryOnError: false,
      fallbackData: defaultCategories,
    }
  )

  return {
    categories,
    loading: isLoading,
    error: error?.message || null,
    refetch: async () => {
      await mutate()
    },
  }
}
