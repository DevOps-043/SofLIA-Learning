'use client'

import { useEffect, useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminStatusBadge, AdminSurface } from '../ui'

interface TopQuestion {
  question: string
  count: number
  category: string
  avgResponseTime: number
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface TopQuestionsWidgetProps {
  period?: string
  limit?: number
  isLoading?: boolean
}

function getSentimentTone(sentiment: TopQuestion['sentiment']) {
  if (sentiment === 'positive') {
    return 'success' as const
  }
  if (sentiment === 'negative') {
    return 'danger' as const
  }
  return 'neutral' as const
}

export function TopQuestionsWidget({ period = 'month', limit = 8, isLoading: externalLoading }: TopQuestionsWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [questions, setQuestions] = useState<TopQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [topCategory, setTopCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/lia-analytics/top-questions?period=${period}&limit=${limit}`)
        const result = await response.json()

        if (result.success) {
          setQuestions(result.data.questions)
          setTotalQuestions(result.data.totalQuestions)
          setTopCategory(result.data.topCategory)
        }
      } catch (error) {
        console.error('Error fetching top questions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [period, limit])

  if (isLoading || externalLoading) {
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

  return (
    <AdminSurface className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
            <ChatBubbleLeftRightIcon className="h-5 w-5" style={{ color: theme.action }} />
            {t('liaAnalyticsWidgets.topQuestions.title')}
          </h3>
          <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.topQuestions.analyzed', { count: totalQuestions.toLocaleString() })}
          </p>
        </div>
        {topCategory ? (
          <AdminStatusBadge tone="info">
            {t('liaAnalyticsWidgets.topQuestions.topCategory', {
              category: t(`liaAnalyticsWidgets.context.labels.${topCategory}`, { defaultValue: topCategory }),
            })}
          </AdminStatusBadge>
        ) : null}
      </div>

      {questions.length === 0 ? (
        <div className="py-8 text-center" style={{ color: theme.textMuted }}>
          <QuestionMarkCircleIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="text-sm">{t('liaAnalyticsWidgets.topQuestions.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => {
            const maxCount = questions[0]?.count || 1
            const widthPercent = (question.count / maxCount) * 100

            return (
              <div key={index} className="relative overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300"
                  style={{ width: `${widthPercent}%`, backgroundColor: theme.actionSurface }}
                />
                <div className="relative flex items-center gap-3 p-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: theme.surfaceSubtle, color: theme.text }}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                      {question.question}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone="neutral">
                        {t(`liaAnalyticsWidgets.context.labels.${question.category}`, { defaultValue: question.category })}
                      </AdminStatusBadge>
                      <span className="text-xs" style={{ color: theme.textMuted }}>
                        {t('liaAnalyticsWidgets.topQuestions.avgResponse', { value: question.avgResponseTime })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AdminStatusBadge tone={getSentimentTone(question.sentiment)}>
                      {t(`liaAnalyticsWidgets.topQuestions.sentiment.${question.sentiment}`)}
                    </AdminStatusBadge>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>
                        {question.count}
                      </p>
                      <p className="text-xs" style={{ color: theme.textMuted }}>
                        {t('liaAnalyticsWidgets.topQuestions.times')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {questions.length > 0 ? (
        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: theme.actionSurface }}>
          <div className="flex items-start gap-2">
            <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: theme.action }} />
            <p className="text-xs leading-5" style={{ color: theme.textMuted }}>
              {t('liaAnalyticsWidgets.topQuestions.insight', {
                category: topCategory
                  ? t(`liaAnalyticsWidgets.context.labels.${topCategory}`, { defaultValue: topCategory })
                  : t('liaAnalyticsWidgets.topQuestions.generalCategory'),
              })}
            </p>
          </div>
        </div>
      ) : null}
    </AdminSurface>
  )
}
