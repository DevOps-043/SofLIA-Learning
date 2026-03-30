'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../features/auth/hooks/useAuth'

interface PromptFavoritesContextType {
  favorites: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (promptId: string) => Promise<boolean>
  isFavorite: (promptId: string) => boolean
  refetch: () => Promise<void>
}

const PromptFavoritesContext = createContext<PromptFavoritesContextType | undefined>(undefined)

export function PromptFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [hasFetched, setHasFetched] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([])
      setLoading(false)
      setHasFetched(true)
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
        // Cache por 30 segundos
        cache: 'no-cache',
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
      setHasFetched(true)
    }
  }, [user?.id])

  const toggleFavorite = useCallback(async (promptId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Debes estar autenticado para usar favoritos')
      return false
    }

    // Usar función de actualización para evitar dependencias problemáticas
    let isCurrentlyFavorite = false
    setFavorites(prev => {
      isCurrentlyFavorite = prev.includes(promptId)
      return isCurrentlyFavorite
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    })

    try {
      setError(null)
      setLoading(true)
      
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
      
      // Leer el cuerpo de la respuesta una sola vez
      const responseText = await response.text()
      let data: any
      
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // Si no es JSON válido, tratar como error
        throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}`)
      }
      
      if (!response.ok) {
        // Revertir el cambio si falla
        setFavorites(prev => {
          const wasIncluded = prev.includes(promptId)
          if (wasIncluded && !isCurrentlyFavorite) {
            return prev.filter(id => id !== promptId)
          } else if (!wasIncluded && isCurrentlyFavorite) {
            return [...prev, promptId]
          }
          return prev
        })
        
        const errorMessage = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      
      const { isFavorite: newFavoriteStatus } = data
      
      // Asegurar que el estado esté sincronizado con la respuesta del servidor
      setFavorites(prev => {
        const currentIncludes = prev.includes(promptId)
        if (newFavoriteStatus && !currentIncludes) {
          return [...prev, promptId]
        } else if (!newFavoriteStatus && currentIncludes) {
          return prev.filter(id => id !== promptId)
        }
        return prev
      })
      
      return newFavoriteStatus
    } catch (err) {
      // Revertir el cambio si falla
      setFavorites(prev => {
        const wasIncluded = prev.includes(promptId)
        if (wasIncluded && !isCurrentlyFavorite) {
          return prev.filter(id => id !== promptId)
        } else if (!wasIncluded && isCurrentlyFavorite) {
          return [...prev, promptId]
        }
        return prev
      })
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const isFavorite = useCallback((promptId: string): boolean => {
    return favorites.includes(promptId)
  }, [favorites])

  useEffect(() => {
    if (!hasFetched && user !== undefined) {
      fetchFavorites()
    }
  }, [user, hasFetched, fetchFavorites])

  // Refetch cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      setHasFetched(false)
    } else {
      setFavorites([])
      setHasFetched(true)
    }
  }, [user?.id])

  return (
    <PromptFavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        toggleFavorite,
        isFavorite,
        refetch: fetchFavorites,
      }}
    >
      {children}
    </PromptFavoritesContext.Provider>
  )
}

export function usePromptFavorites() {
  const context = useContext(PromptFavoritesContext)
  if (context === undefined) {
    throw new Error('usePromptFavorites must be used within a PromptFavoritesProvider')
  }
  return context
}

