'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

interface RecentActivity {
  id: string
  type: 'user_registered' | 'course_created' | 'community_created' | 'prompt_added' | 'ai_app_added'
  description: string
  timestamp: string
  timeAgo: string
  color: string
}

interface RecentActivityWidgetProps {
  period?: '24h' | '7d' | '30d'
}

export function RecentActivityWidget({ period = '24h' }: RecentActivityWidgetProps) {
  const [data, setData] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/admin/statistics/recent-activity?period=${period}`)
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Error al cargar datos')
        }
      } catch (err) {
        setError('Error al cargar actividad reciente')
        techDebtLogger.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  const getPeriodLabel = () => {
    switch (period) {
      case '24h':
        return 'Últimas 24 horas'
      case '7d':
        return 'Últimos 7 días'
      case '30d':
        return 'Últimos 30 días'
      default:
        return 'Últimas 24 horas'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actividad Reciente
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4 mr-1" />
          {getPeriodLabel()}
        </div>
      </div>
      
      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay actividad reciente
          </p>
        ) : (
          data.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center justify-between py-3 ${
                index < data.length - 1
                  ? 'border-b border-gray-200 dark:border-gray-700'
                  : ''
              }`}
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: activity.color }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.description}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activity.timeAgo}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

