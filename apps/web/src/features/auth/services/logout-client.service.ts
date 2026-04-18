'use client'

import { useOrganizationStore } from '@/core/stores/organizationStore'
import { createClient } from '@/lib/supabase/client'

const AUTH_LOCAL_STORAGE_KEYS = [
  'auth-storage',
  'user-auth-cache',
  'accessToken',
  'refreshToken',
  'organization-storage',
] as const

const AUTH_SESSION_STORAGE_KEYS = ['accessToken', 'refreshToken'] as const
const LOGOUT_REQUEST_TIMEOUT_MS = 5000

interface LogoutRequestResult {
  ok: boolean
  status: number | null
}

interface PerformClientLogoutOptions {
  clearUserCache?: () => Promise<unknown> | unknown
  redirectTo?: string
}

type StorageLike = Pick<Storage, 'removeItem'>

function removeStorageKeys(
  storage: StorageLike | null,
  keys: readonly string[]
): void {
  if (!storage) {
    return
  }

  for (const key of keys) {
    try {
      storage.removeItem(key)
    } catch {
      // Storage may be unavailable in private browsing or blocked contexts.
    }
  }
}

function getBrowserStorage(
  kind: 'localStorage' | 'sessionStorage'
): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window[kind]
  } catch {
    return null
  }
}

export function clearBrowserAuthState(): void {
  removeStorageKeys(getBrowserStorage('localStorage'), AUTH_LOCAL_STORAGE_KEYS)
  removeStorageKeys(getBrowserStorage('sessionStorage'), AUTH_SESSION_STORAGE_KEYS)

  try {
    useOrganizationStore.getState().clearOrganization()
  } catch {
    // Zustand may be unavailable during teardown; storage keys were already cleared.
  }
}

async function clearSupabaseBrowserSession(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  try {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Custom httpOnly cookies are the source of truth for app auth.
  }
}

export async function requestServerLogout(): Promise<LogoutRequestResult> {
  if (typeof window === 'undefined') {
    return { ok: false, status: null }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, LOGOUT_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/auth/logout', {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })

    return {
      ok: response.ok,
      status: response.status,
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function clearClientSessionState(): Promise<LogoutRequestResult> {
  clearBrowserAuthState()

  let logoutResult: LogoutRequestResult = { ok: false, status: null }
  try {
    logoutResult = await requestServerLogout()
  } catch {
    // The client state is still cleared; the server endpoint will retry on next logout.
  }

  await clearSupabaseBrowserSession()
  clearBrowserAuthState()

  return logoutResult
}

export function redirectAfterLogout(redirectTo: string = '/'): void {
  if (typeof window === 'undefined') {
    return
  }

  window.location.replace(redirectTo)
}

export async function performClientLogout({
  clearUserCache,
  redirectTo = '/',
}: PerformClientLogoutOptions = {}): Promise<LogoutRequestResult> {
  const logoutResult = await clearClientSessionState()

  try {
    await clearUserCache?.()
  } catch {
    // Redirect must not be blocked by cache cleanup.
  }

  redirectAfterLogout(redirectTo)
  return logoutResult
}
