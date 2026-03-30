'use client'

import { useState, useEffect, useCallback } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/core/utils/date-utils'
import type { Notification as NotificationDB } from '@/features/notifications/services/notification.service'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

interface AdminNotificationsProps {
  notifications?: Notification[]
}

/**
 * Mapea el tipo de notificación de la BD a un tipo del componente
 */
function mapNotificationType(notificationType: string, priority?: string): 'info' | 'success' | 'warning' | 'error' {
  // Si hay prioridad crítica, es error
  if (priority === 'critical') return 'error'
  
  // Mapear tipos de notificación comunes
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    'user_registered': 'info',
    'user_updated': 'info',
    'course_created': 'success',
    'course_updated': 'success',
    'course_published': 'success',
    'course_purchased': 'success',
    'course_completed': 'success',
    'subscription_activated': 'success',
    'community_created': 'success',
    'community_updated': 'info',
    'community_request': 'warning',
    'prompt_created': 'success',
    'prompt_updated': 'info',
    'ai_app_added': 'success',
    'news_published': 'success',
    'error': 'error',
    'warning': 'warning',
    'system_error': 'error'
  }
  
  return typeMap[notificationType] || (priority === 'high' ? 'warning' : 'info')
}

/**
 * Mapea una notificación de la BD a una notificación del componente
 */
function mapNotificationToComponent(notification: NotificationDB): Notification {
  return {
    id: notification.notification_id,
    title: notification.title,
    message: notification.message,
    type: mapNotificationType(notification.notification_type, notification.priority),
    isRead: notification.status === 'read',
    createdAt: notification.created_at,
    actionUrl: notification.metadata?.actionUrl || notification.metadata?.url
  }
}

export function AdminNotifications({ notifications = [] }: AdminNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsList, setNotificationsList] = useState<Notification[]>(notifications)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener notificaciones del usuario (últimas 10, leídas y no leídas)
      const response = await fetch('/api/notifications?limit=10&orderBy=created_at&orderDirection=desc')

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones')
      }

      const data = await response.json()

      if (data.success && data.data?.notifications) {
        const mappedNotifications = data.data.notifications.map(mapNotificationToComponent)
        setNotificationsList(mappedNotifications)
      } else {
        setNotificationsList([])
      }
    } catch (err) {
      setError('No se pudieron cargar las notificaciones')
      setNotificationsList([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para obtener conteo de no leídas
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUnreadCount(data.data.total || 0)
        }
      }
    } catch (err) {
      // Silent error - unread count is not critical
    }
  }, [])

  // Cargar notificaciones y conteo al montar el componente
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [])

  // Actualizar conteo cuando cambian las notificaciones
  useEffect(() => {
    const unread = notificationsList.filter(n => !n.isRead).length
    setUnreadCount(unread)
  }, [notificationsList])

  // Refrescar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'error':
        return 'bg-red-500/10 border-red-500/20'
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Actualizar estado local
        setNotificationsList(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        // Actualizar conteo
        await fetchUnreadCount()
      } else {
      }
    } catch (err) {
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      
      if (response.ok) {
        // Actualizar estado local
        setNotificationsList(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        // Actualizar conteo
        await fetchUnreadCount()
      } else {
      }
    } catch (err) {
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remover de la lista local
        setNotificationsList(prev => 
          prev.filter(notification => notification.id !== notificationId)
        )
        // Actualizar conteo
        await fetchUnreadCount()
      } else {
      }
    } catch (err) {
    }
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
      >
        <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" />
        
        {/* Badge de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-pulse">
                  <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando notificaciones...</p>
                </div>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-12 h-12 text-red-400 dark:text-red-600 mx-auto mb-3" />
                <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="py-2">
                {notificationsList.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                        } px-4 py-3 border-l-4 ${getNotificationBgColor(notification.type)} ${
                          !notification.isRead ? 'bg-gray-100/50 dark:bg-gray-700/30' : ''
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsList.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
