'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNotificationActions } from './useNotificationActions'
import { useNotificationData } from './useNotificationData'
import type { NotificationContextType } from './notification-context.types'

export function useNotificationProviderValue(
  pollingInterval: number,
): NotificationContextType {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const data = useNotificationData({ isDropdownOpen, pollingInterval })
  const { mutateCount, mutateNotifications, shouldFetch } = data
  const revalidateNotificationState = useCallback(async () => {
    const operations: Promise<unknown>[] = [mutateCount()]

    if (isDropdownOpen) {
      operations.push(mutateNotifications())
    }

    await Promise.all(operations)
  }, [isDropdownOpen, mutateCount, mutateNotifications])
  const actions = useNotificationActions(
    revalidateNotificationState,
    mutateNotifications,
    mutateCount,
  )

  useEffect(() => {
    if (!shouldFetch) return

    mutateCount()
    if (isDropdownOpen) {
      mutateNotifications()
    }
  }, [isDropdownOpen, mutateCount, mutateNotifications, shouldFetch])

  useEffect(() => {
    const handleRefresh = async () => {
      await revalidateNotificationState()
    }

    window.addEventListener('refresh-notifications', handleRefresh)
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh)
    }
  }, [revalidateNotificationState])

  return {
    archiveNotification: actions.archiveNotification,
    criticalCount: data.criticalCount,
    deleteNotification: actions.deleteNotification,
    error: data.error,
    highCount: data.highCount,
    isDropdownOpen,
    isLoading: data.isLoading,
    markAllAsRead: actions.markAllAsRead,
    markAsRead: actions.markAsRead,
    notifications: data.notifications,
    refreshNotifications: revalidateNotificationState,
    setIsDropdownOpen,
    unreadCount: data.unreadCount,
  }
}
