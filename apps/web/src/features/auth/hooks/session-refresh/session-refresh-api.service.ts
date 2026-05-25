import type {
  SessionRefreshResult,
  SessionStatusResult,
} from './session-refresh.types'

export async function fetchSessionRefresh(): Promise<SessionRefreshResult> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  const data = await response.json()

  if (!response.ok) {
    return {
      expired: data.code === 'SESSION_EXPIRED',
      error: data.error || 'Error al refrescar token',
    }
  }

  return {
    expired: false,
    expiresAt: data.expiresAt,
  }
}

export async function fetchSessionStatus(): Promise<SessionStatusResult> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return { authenticated: false }
    }

    const data = await response.json()
    return {
      authenticated: Boolean(data.authenticated),
      accessExpiresAt: data.accessExpiresAt,
    }
  } catch {
    return { authenticated: false }
  }
}
