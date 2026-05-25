import type { Dispatch, SetStateAction } from 'react'
import type { Notification } from '../services/notification.service'

export interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  criticalCount: number
  highCount: number
  isLoading: boolean
  error: Error | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveNotification: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  isDropdownOpen: boolean
  setIsDropdownOpen: Dispatch<SetStateAction<boolean>>
}

export interface NotificationListResponse {
  success: boolean
  data: {
    notifications: Notification[]
    total: number
  }
}

export interface NotificationCountResponse {
  success: boolean
  data: {
    total: number
    critical: number
    high: number
  }
}
