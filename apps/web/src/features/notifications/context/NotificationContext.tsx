'use client'

import type { ReactNode } from 'react'
import { NotificationContext } from './notification-context-instance'
import { useNotificationProviderValue } from './useNotificationProviderValue'
export { useNotifications } from './useNotifications'

interface NotificationProviderProps {
  children: ReactNode
  pollingInterval?: number
}

export function NotificationProvider({
  children,
  pollingInterval = 60000,
}: NotificationProviderProps) {
  const value = useNotificationProviderValue(pollingInterval)

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
