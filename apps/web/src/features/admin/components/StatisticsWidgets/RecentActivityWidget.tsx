'use client'

import { useEffect, useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme, type AdminThemeTokens } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

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

function getActivityColor(theme: AdminThemeTokens, type: RecentActivity['type']) {
  switch (type) {
    case 'user_registered':
    case 'course_created':
      return theme.action
    case 'community_created':
      return theme.primary
    case 'prompt_added':
      return theme.warning
    case 'ai_app_added':
      return theme.info
    default:
      return theme.textMuted
  }
}

export function RecentActivityWidget({ period = '24h' }: RecentActivityWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
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
          setError(result.error || t('statisticsWidgets.errors.loadData'))
        }
      } catch (err) {
        setError(t('statisticsWidgets.errors.recentActivity'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [period, t])

  if (isLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
            ))}
          </div>
        </div>
      </AdminSurface>
    )
  }

  if (error) {
    return (
      <AdminSurface className="p-6">
        <p className="text-sm font-semibold" style={{ color: theme.danger }}>
          {error}
        </p>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold" style={{ color: theme.text }}>
          {t('statisticsWidgets.recentActivity.title')}
        </h3>
        <div className="flex items-center text-sm" style={{ color: theme.textMuted }}>
          <ClockIcon className="mr-1 h-4 w-4" />
          {t(`statisticsWidgets.recentActivity.periods.${period}`)}
        </div>
      </div>

      <div className="space-y-1">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: theme.textMuted }}>
            {t('statisticsWidgets.recentActivity.empty')}
          </p>
        ) : (
          data.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center justify-between gap-4 py-3"
              style={{
                borderBottom: index < data.length - 1 ? `1px solid ${theme.divider}` : undefined,
              }}
            >
              <div className="flex min-w-0 items-center">
                <div
                  className="mr-3 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getActivityColor(theme, activity.type) }}
                />
                <span className="truncate text-sm" style={{ color: theme.textMuted }}>
                  {activity.description}
                </span>
              </div>
              <span className="shrink-0 text-sm" style={{ color: theme.textSubtle }}>
                {activity.timeAgo}
              </span>
            </div>
          ))
        )}
      </div>
    </AdminSurface>
  )
}
