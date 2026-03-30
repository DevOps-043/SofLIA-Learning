'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../features/auth/hooks/useAuth'

interface UsePromptFavoritesReturn {
  favorites: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (promptId: string) => Promise<boolean>
  isFavorite: (promptId: string) => boolean
}

export function usePromptFavorites(): UsePromptFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchFavorites = async () => {
    if (!user?.id) {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/prompt-favorites', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.favorites)) {
        setFavorites(data.favorites)
        setError(null)
      } else {
        setFavorites([])
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar favoritos'
      // Si es un error de autenticación, no mostrar error
      if (err instanceof Error && (
        err.message.includes('No autenticado') ||
        err.message.includes('401')
      )) {
        setFavorites([])
        setError(null)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (promptId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes estar autenticado para usar favoritos')
      return false
    }

    try {
      setError(null)
      
      const response = await fetch('/api/prompt-favorites', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const { isFavorite: newFavoriteStatus } = await response.json()
      
      // Actualizar el estado local
      if (newFavoriteStatus) {
        setFavorites(prev => [...prev, promptId])
      } else {
        setFavorites(prev => prev.filter(id => id !== promptId))
      }
      
      return newFavoriteStatus
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return false
    }
  }

  const isFavorite = (promptId: string): boolean => {
    return favorites.includes(promptId)
  }

  useEffect(() => {
    fetchFavorites()
  }, [user?.id])

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite
  }
}

