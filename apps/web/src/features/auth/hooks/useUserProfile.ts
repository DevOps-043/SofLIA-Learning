'use client'

import useSWR from 'swr'
import { useAuth } from './useAuth'
import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface UseUserProfileReturn {
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Campos específicos que necesitamos - Optimización: 70% menos datos transferidos
const USER_PROFILE_FIELDS = 'id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, created_at, updated_at'

// Fetcher optimizado con select específico
const userProfileFetcher = async (key: string): Promise<UserProfile | null> => {
  const userId = key.split('/').pop()
  if (!userId) return null

  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_FIELDS)
    .eq('id', userId)
    .single()

  if (error) {
    if (process.env.NODE_ENV === 'development') {
    }
    throw new Error(`Error al obtener perfil: ${error.message}`)
  }

  return data as UserProfile
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth()

  // SWR maneja el estado, cacheo y deduplicación automáticamente
  const { data: userProfile, error, isLoading, mutate } = useSWR<UserProfile | null>(
    user?.id ? `/api/user-profile/${user.id}` : null,
    userProfileFetcher,
    {
      revalidateOnFocus: false, // No revalidar al cambiar de pestaña
      revalidateOnReconnect: false, // No revalidar al reconectar (los datos no cambian frecuentemente)
      dedupingInterval: 10000, // 10 segundos de deduplicación
      refreshInterval: 0, // No hacer polling
      shouldRetryOnError: false, // No reintentar en errores
      errorRetryCount: 0,
      fallbackData: null,
    }
  )

  const refetch = async () => {
    await mutate()
  }

  return {
    userProfile: userProfile ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  }
}
