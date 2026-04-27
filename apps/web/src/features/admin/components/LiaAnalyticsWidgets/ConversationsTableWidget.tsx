'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import {
  AdminButton,
  AdminIconButton,
  AdminStatusBadge,
  AdminSurface,
  AdminTableContainer,
} from '../ui'

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
  contextType: string
  startedAt: string
  endedAt: string | null
  totalMessages: number
  liaMessages: number
  tokens: number
  cost: number
  avgResponseTimeMs: number
  durationSeconds: number | null
  isCompleted: boolean
  deviceType: string | null
  browser: string | null
}

interface ConversationsTableWidgetProps {
  period?: string
  initialContextFilter?: string
}

export function ConversationsTableWidget({
  period = 'month',
  initialContextFilter,
}: ConversationsTableWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [contextFilter, setContextFilter] = useState(initialContextFilter || '')
  const [showFilters, setShowFilters] = useState(false)

  const contextOptions = useMemo(
    () => [
      { value: '', label: t('liaAnalyticsWidgets.conversations.allContexts') },
      { value: 'course', label: t('liaAnalyticsWidgets.context.labels.course') },
      { value: 'general', label: t('liaAnalyticsWidgets.context.labels.general') },
      { value: 'workshop', label: t('liaAnalyticsWidgets.context.labels.workshop') },
      { value: 'prompts', label: t('liaAnalyticsWidgets.context.labels.prompts') },
      { value: 'community', label: t('liaAnalyticsWidgets.context.labels.community') },
      { value: 'news', label: t('liaAnalyticsWidgets.context.labels.news') },
    ],
    [t],
  )

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (contextFilter) {
        params.append('contextType', contextFilter)
      }

      const endDate = new Date()
      const startDate = new Date()
      let shouldFilterByDate = true

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        case 'all':
          shouldFilterByDate = false
          break
        default:
          startDate.setMonth(startDate.getMonth() - 1)
      }

      if (shouldFilterByDate) {
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      }

      const response = await fetch(`/api/admin/lia-analytics/conversations?${params}`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.data.conversations)
        setTotalPages(data.data.pagination.totalPages)
        setTotal(data.data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [contextFilter, page, period])

  useEffect(() => {
    void fetchConversations()
  }, [fetchConversations])

  const formatDuration = (seconds: number | null) => {
    if (!seconds) {
      return t('liaAnalyticsWidgets.conversations.emptyCell')
    }

    if (seconds < 60) {
      return t('liaAnalyticsWidgets.conversations.seconds', { value: seconds })
    }

    if (seconds < 3600) {
      return t('liaAnalyticsWidgets.conversations.minutesSeconds', {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
      })
    }

    return t('liaAnalyticsWidgets.conversations.hoursMinutes', {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
    })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getContextLabel = (context: string) =>
    t(`liaAnalyticsWidgets.context.labels.${context}`, { defaultValue: context })

  return (
    <AdminTableContainer>
      <div className="border-b p-4" style={{ borderColor: theme.divider }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
              <ChatBubbleLeftRightIcon className="h-5 w-5" style={{ color: theme.action }} />
              {t('liaAnalyticsWidgets.conversations.title')}
            </h3>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {t('liaAnalyticsWidgets.conversations.total', { total: total.toLocaleString() })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AdminIconButton
              icon={FunnelIcon}
              label={t('liaAnalyticsWidgets.conversations.filter')}
              onClick={() => setShowFilters((current) => !current)}
              tone={showFilters || contextFilter ? 'primary' : 'neutral'}
            />
            <AdminIconButton
              icon={ArrowPathIcon}
              label={t('liaAnalyticsWidgets.conversations.refresh')}
              onClick={() => void fetchConversations()}
              disabled={isLoading}
              tone="neutral"
              className={isLoading ? 'animate-spin' : undefined}
            />
          </div>
        </div>

        {showFilters ? (
          <AdminSurface className="mt-4 p-3" style={{ boxShadow: 'none' }}>
            <div className="flex flex-wrap gap-2">
              {contextOptions.map((option) => {
                const active = contextFilter === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setContextFilter(option.value)
                      setPage(1)
                    }}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                    style={{
                      backgroundColor: active ? theme.action : theme.surfaceSubtle,
                      borderColor: active ? theme.action : theme.border,
                      color: active ? theme.onAction : theme.textMuted,
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </AdminSurface>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.user')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.context')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.messages')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.tokens')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.cost')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.duration')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                {t('liaAnalyticsWidgets.conversations.table.date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse" style={{ borderTop: `1px solid ${theme.divider}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
                      <div className="h-4 w-24 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                    </div>
                  </td>
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 w-16 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => (
                <tr
                  key={conversation.id}
                  className="transition hover:opacity-85"
                  style={{ borderTop: `1px solid ${theme.divider}` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {conversation.user?.avatar ? (
                        <img
                          src={conversation.user.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.actionSurface, color: theme.action }}
                        >
                          <UserCircleIcon className="h-5 w-5" />
                        </div>
                      )}
                      <p className="max-w-[150px] truncate text-sm font-semibold" style={{ color: theme.text }}>
                        {conversation.user?.name || t('liaAnalyticsWidgets.conversations.fallbackUser')}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone="info">{getContextLabel(conversation.contextType)}</AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: theme.text }}>
                    {conversation.totalMessages}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: theme.text }}>
                    {conversation.tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: theme.text }}>
                    ${conversation.cost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: theme.textMuted }}>
                    {formatDuration(conversation.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: theme.textMuted }}>
                    {formatDate(conversation.startedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: theme.textMuted }}>
                  {t('liaAnalyticsWidgets.conversations.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div
          className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: theme.divider }}
        >
          <p className="text-sm" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.conversations.pageOf', { page, totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <AdminButton
              variant="secondary"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label={t('liaAnalyticsWidgets.conversations.previous')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              aria-label={t('liaAnalyticsWidgets.conversations.next')}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </AdminButton>
          </div>
        </div>
      ) : null}
    </AdminTableContainer>
  )
}
