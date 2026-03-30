'use client'

import { useState, useEffect } from 'react'
import { 
  UserCircleIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { formatRelativeTime } from '@/core/utils/date-utils'
import type { Notification } from '@/features/notifications/services/notification.service'

interface ActivityItem {
  id: string
  type: 'user' | 'workshop' | 'community' | 'prompt' | 'ai-app' | 'news' | 'system'
  action: string
  description: string
  user: string
  timestamp: string
  icon: React.ComponentType<any>
  color: string
}

/**
 * Mapea el tipo de notificación a un tipo de actividad
 */
function mapNotificationTypeToActivityType(notificationType: string): ActivityItem['type'] {
  const typeMap: Record<string, ActivityItem['type']> = {
    'user_registered': 'user',
    'user_updated': 'user',
    'course_created': 'workshop',
    'course_updated': 'workshop',
    'course_published': 'workshop',
    'community_created': 'community',
    'community_updated': 'community',
    'community_request': 'community',
    'prompt_created': 'prompt',
    'prompt_updated': 'prompt',
    'ai_app_added': 'ai-app',
    'ai_app_updated': 'ai-app',
    'news_published': 'news',
    'news_created': 'news'
  }
  
  return typeMap[notificationType] || 'system'
}

/**
 * Obtiene el icono según el tipo de actividad
 */
function getActivityIcon(type: ActivityItem['type']): React.ComponentType<any> {
  const iconMap: Record<ActivityItem['type'], React.ComponentType<any>> = {
    'user': UserCircleIcon,
    'workshop': BookOpenIcon,
    'community': UserGroupIcon,
    'prompt': ChatBubbleLeftRightIcon,
    'ai-app': CpuChipIcon,
    'news': NewspaperIcon,
    'system': InformationCircleIcon
  }
  
  return iconMap[type] || InformationCircleIcon
}

/**
 * Obtiene el color según el tipo de actividad
 */
function getActivityColor(type: ActivityItem['type'], priority?: string): string {
  // Si hay prioridad crítica o alta, usar colores más llamativos
  if (priority === 'critical') return 'red'
  if (priority === 'high') return 'orange'
  
  const colorMap: Record<ActivityItem['type'], string> = {
    'user': 'blue',
    'workshop': 'green',
    'community': 'purple',
    'prompt': 'orange',
    'ai-app': 'red',
    'news': 'indigo',
    'system': 'blue'
  }
  
  return colorMap[type] || 'blue'
}

/**
 * Mapea una notificación de la BD a un ActivityItem
 */
function mapNotificationToActivityItem(notification: any): ActivityItem {
  const activityType = mapNotificationTypeToActivityType(notification.notification_type)
  const user = notification.users || {}
  
  // Obtener nombre del usuario
  const userName = user.display_name || 
    `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
    user.username || 
    'Usuario'
  
  // Obtener título y descripción de la notificación
  const action = notification.title || 'Actividad'
  const description = notification.message || 'Sin descripción'
  
  return {
    id: notification.notification_id,
    type: activityType,
    action,
    description,
    user: userName,
    timestamp: formatRelativeTime(notification.created_at),
    icon: getActivityIcon(activityType),
    color: getActivityColor(activityType, notification.priority)
  }
}

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/admin/activity/recent?limit=10')
        
        if (!response.ok) {
          throw new Error('Error al obtener actividad reciente')
        }

        const data = await response.json()
        
        if (data.success && data.activities) {
          // Mapear notificaciones a ActivityItems
          const mappedActivities = data.activities.map(mapNotificationToActivityItem)
          setActivities(mappedActivities)
        } else {
          setActivities([])
        }
      } catch (err) {
        setError('No se pudo cargar la actividad reciente')
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchRecentActivity, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Actividad Reciente
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Ver todo
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {activities.length === 0 && !isLoading && !error ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay actividad reciente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const colors = getColorClasses(activity.color)
              const Icon = activity.icon
              return (
                <div 
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`flex-shrink-0 p-2 rounded-full ${colors.bg} border ${colors.border}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {activity.timestamp}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      por {activity.user}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
