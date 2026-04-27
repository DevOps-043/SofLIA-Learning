'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import {
  AdminButton,
  AdminMetricCard,
  AdminModalShell,
  AdminStatusBadge,
  AdminSurface,
  AdminTabs,
} from '../ui'

interface HourDetailData {
  slot: {
    dayOfWeek: number
    dayName: string
    hour: number
    hourFormatted: string
  }
  summary: {
    totalMessages: number
    userMessages: number
    assistantMessages: number
    uniqueUsers: number
    uniqueConversations: number
    totalTokens: number
    totalCost: number
    avgResponseTime: number
  }
  topUsers: Array<{
    name: string
    email?: string
    avatar?: string
    messageCount: number
    conversationCount: number
    questions: string[]
    tokens: number
    cost: number
  }>
  topQuestions: Array<{
    content: string
    timestamp: string
    responseTime: number | null
  }>
  contextDistribution: Array<{
    context: string
    count: number
    percentage: number
  }>
  modelsUsed: Array<{
    model: string
    count: number
  }>
  activityDates: string[]
}

interface HeatmapDetailModalProps {
  isOpen: boolean
  onClose: () => void
  dayOfWeek: number
  hour: number
  period: string
}

type HeatmapTab = 'overview' | 'users' | 'questions'

export function HeatmapDetailModal({ isOpen, onClose, dayOfWeek, hour, period }: HeatmapDetailModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [data, setData] = useState<HourDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<HeatmapTab>('overview')

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: t('liaAnalyticsWidgets.heatmapDetail.tabs.overview'), icon: ChartPieIcon },
      { id: 'users' as const, label: t('liaAnalyticsWidgets.heatmapDetail.tabs.users'), icon: UserGroupIcon },
      { id: 'questions' as const, label: t('liaAnalyticsWidgets.heatmapDetail.tabs.questions'), icon: ChatBubbleLeftRightIcon },
    ],
    [t],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/admin/lia-analytics/hour-detail?dayOfWeek=${dayOfWeek}&hour=${hour}&period=${period}`,
        )
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching hour detail:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [dayOfWeek, hour, isOpen, period])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })

  const getContextLabel = (context: string) =>
    t(`liaAnalyticsWidgets.context.labels.${context}`, { defaultValue: context })

  const periodLabel = t(`liaAnalyticsPage.periods.${period}`, {
    defaultValue: period === 'all' ? t('liaAnalyticsWidgets.heatmapDetail.allPeriods') : period,
  })

  const title = data
    ? t('liaAnalyticsWidgets.heatmapDetail.title', {
      day: data.slot.dayName,
      hour: data.slot.hourFormatted,
    })
    : t('liaAnalyticsWidgets.heatmapDetail.fallbackTitle')

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={ChartPieIcon}
      title={title}
      description={t('liaAnalyticsWidgets.heatmapDetail.description')}
      className="max-w-4xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.heatmapDetail.periodValue', { period: periodLabel })}
          </p>
          <AdminButton variant="secondary" onClick={onClose}>
            {t('liaAnalyticsWidgets.heatmapDetail.close')}
          </AdminButton>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: theme.surfaceSubtle }} />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-2xl" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      ) : data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              icon={ChatBubbleLeftRightIcon}
              label={t('liaAnalyticsWidgets.heatmapDetail.stats.messages')}
              value={data.summary.totalMessages}
              tone="info"
            />
            <AdminMetricCard
              icon={UserGroupIcon}
              label={t('liaAnalyticsWidgets.heatmapDetail.stats.users')}
              value={data.summary.uniqueUsers}
              tone="primary"
            />
            <AdminMetricCard
              icon={ClockIcon}
              label={t('liaAnalyticsWidgets.heatmapDetail.stats.avgResponse')}
              value={`${data.summary.avgResponseTime}ms`}
              tone="warning"
            />
            <AdminMetricCard
              icon={CurrencyDollarIcon}
              label={t('liaAnalyticsWidgets.heatmapDetail.stats.cost')}
              value={`$${data.summary.totalCost.toFixed(4)}`}
              tone="neutral"
            />
          </div>

          <AdminTabs<HeatmapTab>
            value={activeTab}
            onChange={setActiveTab}
            tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label, icon: tab.icon }))}
          />

          <div className="max-h-[420px] overflow-y-auto pr-1">
            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <AdminSurface className="p-4" style={{ boxShadow: 'none' }}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: theme.text }}>
                    <ChartPieIcon className="h-4 w-4" style={{ color: theme.action }} />
                    {t('liaAnalyticsWidgets.heatmapDetail.contextDistribution')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.contextDistribution.map((context) => (
                      <AdminStatusBadge key={context.context} tone="info">
                        {t('liaAnalyticsWidgets.heatmapDetail.contextValue', {
                          context: getContextLabel(context.context),
                          count: context.count,
                          percentage: context.percentage,
                        })}
                      </AdminStatusBadge>
                    ))}
                  </div>
                </AdminSurface>

                <AdminSurface className="p-4" style={{ boxShadow: 'none' }}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: theme.text }}>
                    <CpuChipIcon className="h-4 w-4" style={{ color: theme.action }} />
                    {t('liaAnalyticsWidgets.heatmapDetail.modelsUsed')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.modelsUsed.map((model) => (
                      <AdminStatusBadge key={model.model} tone="neutral">
                        {t('liaAnalyticsWidgets.heatmapDetail.modelValue', {
                          model: model.model,
                          count: model.count,
                        })}
                      </AdminStatusBadge>
                    ))}
                  </div>
                </AdminSurface>

                <AdminSurface className="p-4" style={{ boxShadow: 'none' }}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: theme.text }}>
                    <CalendarDaysIcon className="h-4 w-4" style={{ color: theme.action }} />
                    {t('liaAnalyticsWidgets.heatmapDetail.activityDates')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.activityDates.map((date) => (
                      <span
                        key={date}
                        className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                        style={{
                          backgroundColor: theme.surfaceSubtle,
                          borderColor: theme.border,
                          color: theme.textMuted,
                        }}
                      >
                        {formatDate(date)}
                      </span>
                    ))}
                  </div>
                </AdminSurface>

                <AdminSurface className="p-4" style={{ backgroundColor: theme.actionSurface, boxShadow: 'none' }}>
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 h-5 w-5" style={{ color: theme.action }} />
                    <div>
                      <p className="text-sm" style={{ color: theme.text }}>
                        {t('liaAnalyticsWidgets.heatmapDetail.tokenSummary', {
                          tokens: data.summary.totalTokens.toLocaleString(),
                          conversations: data.summary.uniqueConversations,
                        })}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
                        {t('liaAnalyticsWidgets.heatmapDetail.tokenAverage', {
                          value: Math.round(data.summary.totalTokens / Math.max(data.summary.uniqueConversations, 1)),
                        })}
                      </p>
                    </div>
                  </div>
                </AdminSurface>
              </div>
            ) : null}

            {activeTab === 'users' ? (
              <div className="space-y-3">
                {data.topUsers.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: theme.textMuted }}>
                    {t('liaAnalyticsWidgets.heatmapDetail.emptyUsers')}
                  </p>
                ) : (
                  data.topUsers.map((user, index) => (
                    <AdminSurface key={`${user.email || user.name}-${index}`} className="p-4" style={{ boxShadow: 'none' }}>
                      <div className="flex items-start gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            style={{ backgroundColor: theme.actionSurface, color: theme.action }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold" style={{ color: theme.text }}>
                              {user.name}
                            </p>
                            {index < 3 ? (
                              <AdminStatusBadge tone="warning">
                                {t('liaAnalyticsWidgets.heatmapDetail.rankLabel', { rank: index + 1 })}
                              </AdminStatusBadge>
                            ) : null}
                          </div>
                          {user.email ? (
                            <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                              {user.email}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                            <span>{t('liaAnalyticsWidgets.heatmapDetail.messageShort', { count: user.messageCount })}</span>
                            <span>/</span>
                            <span>{t('liaAnalyticsWidgets.heatmapDetail.conversationShort', { count: user.conversationCount })}</span>
                            <span>/</span>
                            <span>{t('liaAnalyticsWidgets.heatmapDetail.tokenShort', { count: user.tokens.toLocaleString() })}</span>
                            <span>/</span>
                            <span>${user.cost.toFixed(4)}</span>
                          </div>
                          {user.questions.length > 0 ? (
                            <div className="mt-3 space-y-1">
                              {user.questions.slice(0, 2).map((question, questionIndex) => (
                                <p key={questionIndex} className="truncate text-xs italic" style={{ color: theme.textMuted }}>
                                  "{question}..."
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </AdminSurface>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === 'questions' ? (
              <div className="space-y-3">
                {data.topQuestions.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: theme.textMuted }}>
                    {t('liaAnalyticsWidgets.heatmapDetail.emptyQuestions')}
                  </p>
                ) : (
                  data.topQuestions.map((question, index) => (
                    <AdminSurface key={`${question.timestamp}-${index}`} className="p-4" style={{ boxShadow: 'none' }}>
                      <p className="text-sm" style={{ color: theme.text }}>
                        "{question.content}"
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                        <span>{formatDate(question.timestamp)} {formatTime(question.timestamp)}</span>
                        {question.responseTime ? (
                          <>
                            <span>/</span>
                            <span style={{ color: theme.action }}>
                              {t('liaAnalyticsWidgets.heatmapDetail.responseIn', { value: question.responseTime })}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </AdminSurface>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.heatmapDetail.dataUnavailable')}
        </p>
      )}
    </AdminModalShell>
  )
}
