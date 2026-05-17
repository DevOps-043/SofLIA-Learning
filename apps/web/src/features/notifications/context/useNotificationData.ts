'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDevicePerformanceMode } from '@/lib/utils/mobile-performance'
import { sortNotificationsByPriority } from './notification-sort'
import type {
  NotificationCountResponse,
  NotificationListResponse,
} from './notification-context.types'

function ignoreAuthErrors(error: unknown) {
  if (error instanceof Error && error.message.includes('401')) {
    return
  }
}

export function useNotificationData(params: {
  isDropdownOpen: boolean
  pollingInterval: number
}) {
  const [isMounted, setIsMounted] = useState(false)
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const performanceMode = useDevicePerformanceMode()

  useEffect(() => setIsMounted(true), [])

  const shouldFetch = isMounted && !authLoading && isAuthenticated && !!user
  const effectivePollingInterval = performanceMode.reducePolling
    ? Math.max(params.pollingInterval, 180000)
    : params.pollingInterval
  const shouldFetchList = shouldFetch && params.isDropdownOpen

  const notifications = useSWR<NotificationListResponse>(
    shouldFetchList
      ? '/api/notifications?status=unread&limit=10&orderBy=created_at&orderDirection=desc'
      : null,
    {
      refreshInterval: shouldFetchList ? effectivePollingInterval : 0,
      revalidateOnFocus: shouldFetchList && !performanceMode.reducePolling,
      revalidateOnReconnect: shouldFetchList,
      dedupingInterval: 5000,
      revalidateIfStale: shouldFetchList,
      onError: ignoreAuthErrors,
    },
  )
  const counts = useSWR<NotificationCountResponse>(
    shouldFetch ? '/api/notifications/unread-count' : null,
    {
      refreshInterval: shouldFetch ? effectivePollingInterval : 0,
      revalidateOnFocus: shouldFetch && !performanceMode.reducePolling,
      revalidateOnReconnect: shouldFetch,
      dedupingInterval: 5000,
      revalidateIfStale: shouldFetch,
      onError: ignoreAuthErrors,
    },
  )

  return {
    criticalCount: counts.data?.data?.critical || 0,
    error: notifications.error || counts.error || null,
    highCount: counts.data?.data?.high || 0,
    isLoading: params.isDropdownOpen && notifications.isLoading,
    mutateCount: counts.mutate,
    mutateNotifications: notifications.mutate,
    notifications: useMemo(() => {
      return sortNotificationsByPriority(
        notifications.data?.data?.notifications || [],
      )
    }, [notifications.data?.data?.notifications]),
    shouldFetch,
    unreadCount: counts.data?.data?.total || 0,
  }
}
