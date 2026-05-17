import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchSessionRefresh,
  fetchSessionStatus,
} from './session-refresh/session-refresh-api.service'
import type { UseSessionRefreshOptions } from './session-refresh/session-refresh.types'

export function useSessionRefresh(options: UseSessionRefreshOptions = {}) {
  const {
    refreshBeforeExpiry = 5,
    redirectOnExpiry = true,
    onRefresh,
    onExpiry,
  } = options
  const router = useRouter()
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const refreshTokenRef = useRef<() => Promise<void>>(async () => undefined)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const scheduleNextRefresh = useCallback((expiresAt: string) => {
    clearRefreshTimer()

    const expiryTime = new Date(expiresAt).getTime()
    const timeUntilExpiry = expiryTime - Date.now()
    const refreshTime = timeUntilExpiry - refreshBeforeExpiry * 60 * 1000

    if (refreshTime <= 0) {
      void refreshTokenRef.current()
      return
    }

    refreshTimerRef.current = setTimeout(() => {
      void refreshTokenRef.current()
    }, refreshTime)
  }, [clearRefreshTimer, refreshBeforeExpiry])

  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      return
    }

    try {
      isRefreshingRef.current = true
      const result = await fetchSessionRefresh()

      if (result.expired) {
        onExpiry?.()
        if (redirectOnExpiry) {
          router.push('/auth?error=session_expired')
        }
        return
      }

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.expiresAt) {
        scheduleNextRefresh(result.expiresAt)
      }

      onRefresh?.()
    } catch {
      refreshTimerRef.current = setTimeout(() => {
        void refreshToken()
      }, 30000)
    } finally {
      isRefreshingRef.current = false
    }
  }, [onRefresh, onExpiry, redirectOnExpiry, router, scheduleNextRefresh])

  refreshTokenRef.current = refreshToken

  const initializeSession = useCallback(async () => {
    const status = await fetchSessionStatus()

    if (status.authenticated && status.accessExpiresAt) {
      scheduleNextRefresh(status.accessExpiresAt)
    }
  }, [scheduleNextRefresh])

  useEffect(() => {
    void initializeSession()
    return clearRefreshTimer
  }, [initializeSession, clearRefreshTimer])

  const refreshNow = useCallback(() => {
    clearRefreshTimer()
    void refreshToken()
  }, [clearRefreshTimer, refreshToken])

  return {
    refreshNow,
    isRefreshing: isRefreshingRef.current,
  }
}
