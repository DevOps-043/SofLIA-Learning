'use client'

import useSWR from 'swr'
import { Notification } from '../services/notification.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMemo, useState } from 'react'

export type NotificationStatusFilter = 'all' | 'unread' | 'read' | 'archived'

interface UseNotificationListOptions {
  status?: NotificationStatusFilter
  limit?: number
  offset?: number
}

export function useNotificationList(options: UseNotificationListOptions = {}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>(options.status || 'all')
  const [limit, setLimit] = useState(options.limit || 50)
  
  // Memoized to keep the SWR key stable between renders
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.append('status', statusFilter)
    params.append('limit', limit.toString())
    params.append('orderBy', 'created_at')
    params.append('orderDirection', 'desc')
    return params.toString()
  }, [statusFilter, limit])

  const shouldFetch = !authLoading && isAuthenticated && !!user

  const { data, error, mutate, isLoading } = useSWR<{ success: boolean; data: { notifications: Notification[]; total: number } }>(
    shouldFetch ? `/api/notifications?${queryString}` : null,
    {
      revalidateOnFocus: false,  // Polled by NotificationContext; focus revalidation is redundant
      dedupingInterval: 10000,
    }
  )

  return {
    notifications: data?.data?.notifications || [],
    total: data?.data?.total || 0,
    isLoading,
    error,
    mutate,
    statusFilter,
    setStatusFilter,
    limit,
    setLimit
  }
}
