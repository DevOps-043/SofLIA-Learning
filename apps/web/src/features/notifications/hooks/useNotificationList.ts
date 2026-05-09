'use client'

import useSWR from 'swr'
import { Notification } from '../services/notification.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useState } from 'react'

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
  
  const queryParams = new URLSearchParams()
  if (statusFilter !== 'all') {
    queryParams.append('status', statusFilter)
  }
  queryParams.append('limit', limit.toString())
  queryParams.append('orderBy', 'created_at')
  queryParams.append('orderDirection', 'desc')

  const shouldFetch = !authLoading && isAuthenticated && !!user

  const { data, error, mutate, isLoading } = useSWR<{ success: boolean; data: { notifications: Notification[]; total: number } }>(
    shouldFetch ? `/api/notifications?${queryParams.toString()}` : null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000
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
