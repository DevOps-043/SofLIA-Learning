'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface, AdminTabs } from '../ui'

interface CourseMetric {
  courseId: string
  title: string
  totalConversations: number
  uniqueUsers: number
  totalMessages: number
  totalTokens: number
  totalCost: number
  avgDurationSeconds: number
  topModules: Array<{
    moduleId: string
    title: string
    conversations: number
    tokens: number
    totalCost: number
  }>
}

interface CourseAnalyticsWidgetProps {
  period: string
  isLoading?: boolean
}

type SortBy = 'cost' | 'conversations' | 'users'

export function CourseAnalyticsWidget({ period }: CourseAnalyticsWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [data, setData] = useState<CourseMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('cost')
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const fetchCourseData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/lia-analytics/courses?period=${period}&_t=${timestamp}`, {
        cache: 'no-store',
      })
      const result = await response.json()

      if (result.success) {
        setData(result.data.courses)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(t('liaAnalyticsWidgets.course.loadError'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [period, t])

  useEffect(() => {
    void fetchCourseData()
  }, [fetchCourseData])

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'cost') {
      return b.totalCost - a.totalCost
    }
    if (sortBy === 'conversations') {
      return b.totalConversations - a.totalConversations
    }
    if (sortBy === 'users') {
      return b.uniqueUsers - a.uniqueUsers
    }
    return 0
  })

  const toggleExpand = (courseId: string) => {
    setExpandedCourse((current) => (current === courseId ? null : courseId))
  }

  const Header = () => (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
        <AcademicCapIcon className="h-5 w-5" style={{ color: theme.action }} />
        {t('liaAnalyticsWidgets.course.title')}
      </h3>
      <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
        {t('liaAnalyticsWidgets.course.description')}
      </p>
    </div>
  )

  if (isLoading) {
    return (
      <AdminSurface className="h-96 p-6">
        <Header />
        <div className="mt-6 animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-12 w-full rounded-xl" style={{ backgroundColor: theme.surfaceSubtle }} />
          ))}
        </div>
      </AdminSurface>
    )
  }

  if (error) {
    return (
      <AdminSurface className="p-6 text-center">
        <p className="text-sm font-semibold" style={{ color: theme.danger }}>
          {error}
        </p>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: theme.divider }}>
        <Header />
        <AdminTabs
          value={sortBy}
          onChange={setSortBy}
          tabs={[
            { value: 'cost', label: t('liaAnalyticsWidgets.course.sort.cost') },
            { value: 'conversations', label: t('liaAnalyticsWidgets.course.sort.conversations') },
            { value: 'users', label: t('liaAnalyticsWidgets.course.sort.users') },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
            <tr>
              <th className="px-5 py-3 font-bold">{t('liaAnalyticsWidgets.course.table.course')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('liaAnalyticsWidgets.course.table.totalCost')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('liaAnalyticsWidgets.course.table.conversations')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('liaAnalyticsWidgets.course.table.messages')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('liaAnalyticsWidgets.course.table.uniqueUsers')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('liaAnalyticsWidgets.course.table.tokens')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((course) => (
                <Fragment key={course.courseId}>
                  <tr
                    onClick={() => toggleExpand(course.courseId)}
                    className="cursor-pointer transition-opacity hover:opacity-85"
                    style={{ borderTop: `1px solid ${theme.divider}` }}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold" style={{ color: theme.text }}>{course.title}</div>
                      {course.topModules?.length > 0 ? (
                        <div className="mt-1 text-xs font-semibold" style={{ color: theme.action }}>
                          {expandedCourse === course.courseId
                            ? t('liaAnalyticsWidgets.course.hideDetails')
                            : t('liaAnalyticsWidgets.course.showModuleBreakdown')}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold" style={{ color: theme.action }}>
                      ${course.totalCost.toFixed(4)}
                    </td>
                    <td className="px-5 py-4 text-right" style={{ color: theme.text }}>{course.totalConversations}</td>
                    <td className="px-5 py-4 text-right" style={{ color: theme.textMuted }}>{course.totalMessages}</td>
                    <td className="px-5 py-4 text-right" style={{ color: theme.textMuted }}>{course.uniqueUsers}</td>
                    <td className="px-5 py-4 text-right font-mono text-xs" style={{ color: theme.textMuted }}>
                      {(course.totalTokens / 1000).toFixed(1)}k
                    </td>
                  </tr>
                  {expandedCourse === course.courseId && course.topModules?.length > 0 ? (
                    <tr style={{ backgroundColor: theme.surfaceSubtle }}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="border-l-2 pl-4" style={{ borderColor: theme.action }}>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                            {t('liaAnalyticsWidgets.course.topModules')}
                          </h4>
                          <div className="space-y-2">
                            {course.topModules.map((module) => (
                              <div key={module.moduleId} className="flex items-center justify-between gap-4 text-sm">
                                <span className="max-w-xs truncate" style={{ color: theme.text }}>
                                  {module.title}
                                </span>
                                <div className="flex items-center gap-4 text-xs" style={{ color: theme.textMuted }}>
                                  <span>{t('liaAnalyticsWidgets.course.conversationShort', { count: module.conversations })}</span>
                                  <span className="font-mono font-semibold" style={{ color: theme.action }}>
                                    ${module.totalCost.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center" style={{ color: theme.textMuted }}>
                  {t('liaAnalyticsWidgets.course.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminSurface>
  )
}
