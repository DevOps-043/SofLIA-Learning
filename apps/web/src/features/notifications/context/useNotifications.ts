'use client'

import { useContext } from 'react'
import { NotificationContext } from './notification-context-instance'

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }

  return context
}
