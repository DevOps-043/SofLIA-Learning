'use client'

import useSWR from 'swr'

import { clearAuthUserCache, USER_AUTH_CACHE_KEY } from '@/lib/auth/user-auth-cache'
import { performClientLogout } from '../services/logout-client.service'

interface User {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
  display_name?: string
  cargo_rol?: string
  created_at?: string
  job_title?: string
  job_description?: string
  profile_picture_url?: string
  updated_at?: string
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

interface CachedUserPayload {
  user: User | null
  timestamp: number
}

interface AuthMeResponse {
  success?: boolean
  user?: User | null
}

const USER_CACHE_KEY = USER_AUTH_CACHE_KEY
const CACHE_EXPIRY_MS = 5 * 60 * 1000

function isCachedUserPayload(value: unknown): value is CachedUserPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<CachedUserPayload>
  return typeof payload.timestamp === 'number' && 'user' in payload
}

const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    if (!cached) {
      return null
    }

    const parsed: unknown = JSON.parse(cached)
    if (!isCachedUserPayload(parsed)) {
      clearAuthUserCache()
      return null
    }

    if (Date.now() - parsed.timestamp > CACHE_EXPIRY_MS) {
      clearAuthUserCache()
      return null
    }

    return parsed.user
  } catch {
    return null
  }
}

const setCachedUser = (user: User | null) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (user) {
      localStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({ user, timestamp: Date.now() })
      )
    } else {
      clearAuthUserCache()
    }
  } catch {
    // localStorage can be blocked by the browser.
  }
}

const authFetcher = async (url: string): Promise<User | null> => {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setCachedUser(null)
        return null
      }

      throw new Error('Error fetching user')
    }

    const data = (await response.json()) as AuthMeResponse
    const user = data.success === true && data.user ? data.user : null
    setCachedUser(user)

    return user
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return getCachedUser()
    }

    return getCachedUser()
  }
}

export function useAuth() {
  const cachedUser = typeof window !== 'undefined' ? getCachedUser() : null

  const { data: user, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/me',
    authFetcher,
    {
      dedupingInterval: 5000,
      errorRetryCount: 0,
      fallbackData: cachedUser,
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      onError: (authError) => {
        if (
          authError instanceof TypeError &&
          authError.message === 'Failed to fetch'
        ) {
          return
        }
      },
    }
  )

  const logout = async () => {
    await performClientLogout({
      clearUserCache: () => mutate(null, false),
      redirectTo: '/',
    })
  }

  const refreshUser = async () => {
    try {
      const updatedUser = await mutate()
      return updatedUser ?? null
    } catch {
      return null
    }
  }

  return {
    user: user ?? null,
    loading: isLoading,
    isLoading,
    logout,
    mutate,
    refreshUser,
    isAuthenticated: !!user && !error,
  }
}
