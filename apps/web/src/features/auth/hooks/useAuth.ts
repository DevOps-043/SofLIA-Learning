'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'

interface User {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
  display_name?: string
  cargo_rol?: string
  job_title?: string // Cargo/puesto del usuario en la organización (viene de organization_users)
  // type_rol?: string // DEPRECATED: Eliminado por migración - usar organization_users.job_title
  profile_picture_url?: string
  organization_id?: string | null
  organization?: {
    id: string
    name: string
    logo_url?: string
    brand_logo_url?: string
    brand_favicon_url?: string
    favicon_url?: string
    slug?: string
  } | null
}

// Cache key para localStorage
const USER_CACHE_KEY = 'user-auth-cache'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutos

// Helper para obtener usuario desde cache
const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    if (!cached) return null
    const { user, timestamp } = JSON.parse(cached)
    // Verificar si el cache ha expirado
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(USER_CACHE_KEY)
      return null
    }
    return user
  } catch {
    return null
  }
}

// Helper para guardar usuario en cache
const setCachedUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ user, timestamp: Date.now() }))
    } else {
      localStorage.removeItem(USER_CACHE_KEY)
    }
  } catch {
    // Silenciar errores de localStorage
  }
}

// Fetcher optimizado para autenticación con cache
const authFetcher = async (url: string): Promise<User | null> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Si no está autenticado, limpiar cache y retornar null
      if (response.status === 401 || response.status === 403) {
        setCachedUser(null)
        return null
      }
      throw new Error('Error fetching user')
    }

    const data = await response.json()
    const user = data.success && data.user ? data.user : null

    // Guardar en cache para carga instantánea en próximas visitas
    setCachedUser(user)

    return user
  } catch (error) {
    // Manejar errores de red de forma silenciosa
    // "Failed to fetch" puede ocurrir cuando el componente se desmonta durante la navegación
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Error de red esperado durante navegación - retornar cache si existe
      return getCachedUser()
    }

    if (process.env.NODE_ENV === 'development') {
    }
    return getCachedUser() // Intentar retornar cache en caso de error
  }
}

export function useAuth() {
  const router = useRouter()

  // OPTIMIZACIÓN: Usar cache de localStorage como fallbackData para carga instantánea
  const cachedUser = typeof window !== 'undefined' ? getCachedUser() : null

  // SWR maneja el estado global, deduplicación y caché automáticamente
  const { data: user, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/me',
    authFetcher,
    {
      // Configuración optimizada para autenticación
      revalidateOnFocus: false, // No revalidar al cambiar de pestaña (el usuario no cambia constantemente)
      revalidateOnReconnect: true, // Sí revalidar al reconectar (podría haber cambiado la sesión)
      dedupingInterval: 5000, // Deduplicar solicitudes dentro de 5 segundos - CLAVE para evitar múltiples llamadas
      refreshInterval: 0, // No hacer polling automático
      shouldRetryOnError: false, // No reintentar en errores (si no está autenticado, no hay que reintentar)
      errorRetryCount: 0, // No reintentar
      fallbackData: cachedUser, // OPTIMIZADO: Usar cache para mostrar datos instantáneamente
      onError: (error) => {
        // Ignorar errores de red esperados (Failed to fetch durante navegación)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          return // No hacer nada, el fetcher ya retorna null
        }
      },
    }
  )

  const logout = async () => {
    try {
      // ⚠️ CRITICAL SECURITY FIX: Limpiar TODO el localStorage de auth PRIMERO
      if (typeof window !== 'undefined') {
        // Limpiar auth-storage (Zustand persist) - CRÍTICO
        localStorage.removeItem('auth-storage');
        // Limpiar cache de usuario
        localStorage.removeItem(USER_CACHE_KEY);
        // Limpiar tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

      }

      // Llamar a la API de logout para destruir cookies del servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Limpiar caché de SWR completamente
      await mutate(null, false)

      // SECURITY FIX: Forzar recarga completa para limpiar todo el estado en memoria
      window.location.href = '/'
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during logout:', error)
      }

      // ⚠️ CRITICAL: Asegurar limpieza incluso si hay error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      await mutate(null, false)
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    try {
      // mutate() revalida y devuelve los nuevos datos
      const updatedUser = await mutate()
      return updatedUser ?? null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      return null
    }
  }

  return {
    user: user ?? null,
    loading: isLoading,
    isLoading, // Alias para compatibilidad
    logout,
    refreshUser,
    isAuthenticated: !!user && !error,
  }
}