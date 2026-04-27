'use client'

import { useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

import { useTranslation } from 'react-i18next'
import { useAdminTheme, type AdminThemeTokens } from '../../hooks/useAdminTheme'
import { AdminMetricCard, AdminSurface } from '../ui'

interface ActivitySummary {
  totalActivities: number
  completedActivities: number
  abandonedActivities: number
  inProgressActivities: number
  completionRate: number
  abandonRate: number
  avgCompletionTimeSeconds: number
  avgRedirections: number
}

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

interface ActivityPerformanceWidgetProps {
  period?: string
  isLoading?: boolean
}

function getStatusColor(theme: AdminThemeTokens, status: string) {
  switch (status) {
    case 'completed':
      return theme.action
    case 'abandoned':
      return theme.danger
    case 'in_progress':
    case 'started':
      return theme.warning
    default:
      return theme.textMuted
  }
}

export function ActivityPerformanceWidget({ period = 'month', isLoading: externalLoading }: ActivityPerformanceWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/lia-analytics/activities?period=${period}`)
        const data = await response.json()

        if (data.success) {
          setSummary(data.data.summary)
          setStatusData(data.data.byStatus)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchActivities()
  }, [period])

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return t('liaAnalyticsWidgets.activity.seconds', { value: seconds })
    }
    if (seconds < 3600) {
      return t('liaAnalyticsWidgets.activity.minutesSeconds', {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
      })
    }
    return t('liaAnalyticsWidgets.activity.hoursMinutes', {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
    })
  }

  if (isLoading || externalLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="mb-4 grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 rounded-xl" style={{ backgroundColor: theme.surfaceSubtle }} />
            ))}
          </div>
          <div className="h-4 w-full rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  if (!summary) {
    return (
      <AdminSurface className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <BoltIcon className="h-5 w-5" style={{ color: theme.action }} />
          {t('liaAnalyticsWidgets.activity.title')}
        </h3>
        <p className="py-8 text-center text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.activity.empty')}
        </p>
      </AdminSurface>
    )
  }

  const metrics = [
    {
      label: t('liaAnalyticsWidgets.activity.completionRate'),
      value: `${summary.completionRate}%`,
      icon: CheckCircleIcon,
    },
    {
      label: t('liaAnalyticsWidgets.activity.abandonRate'),
      value: `${summary.abandonRate}%`,
      icon: XCircleIcon,
    },
    {
      label: t('liaAnalyticsWidgets.activity.avgTime'),
      value: formatTime(summary.avgCompletionTimeSeconds),
      icon: ClockIcon,
    },
    {
      label: t('liaAnalyticsWidgets.activity.avgRedirections'),
      value: summary.avgRedirections.toFixed(1),
      icon: ArrowPathIcon,
    },
  ]

  return (
    <AdminSurface className="p-6">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <BoltIcon className="h-5 w-5" style={{ color: theme.action }} />
          {t('liaAnalyticsWidgets.activity.title')}
        </h3>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.activity.total', { count: summary.totalActivities })}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <AdminMetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            tone="info"
            className="min-h-[112px]"
          />
        ))}
      </div>

      {statusData.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.activity.statusDistribution')}
          </p>
          <div className="flex h-4 overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
            {statusData.map((status) => (
              <div
                key={status.status}
                className="h-full transition-all duration-300"
                style={{
                  width: `${status.percentage}%`,
                  backgroundColor: getStatusColor(theme, status.status),
                }}
                title={`${t(`liaAnalyticsWidgets.activity.status.${status.status}`, { defaultValue: status.status })}: ${status.count} (${status.percentage}%)`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {statusData.map((status) => (
              <div key={status.status} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(theme, status.status) }}
                />
                <span className="text-xs" style={{ color: theme.textMuted }}>
                  {t(`liaAnalyticsWidgets.activity.status.${status.status}`, { defaultValue: status.status })}: {status.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AdminSurface>
  )
}
