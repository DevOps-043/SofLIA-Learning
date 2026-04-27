'use client'

import { useEffect, useState } from 'react'
import { TrophyIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSelect, AdminSurface } from '../ui'

interface TopUser {
  rank: number
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string | null
  } | null
  stats: {
    conversations: number
    messages: number
    liaMessages: number
    tokens: number
    cost: number
    avgTokensPerConversation: number
    avgCostPerConversation: number
  }
}

interface TopUsersWidgetProps {
  period?: string
  limit?: number
  isLoading?: boolean
}

type SortBy = 'cost' | 'tokens' | 'messages' | 'conversations'

export function TopUsersWidget({ period = 'month', limit = 10, isLoading: externalLoading }: TopUsersWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [users, setUsers] = useState<TopUser[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('cost')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTopUsers = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/admin/lia-analytics/top-users?period=${period}&limit=${limit}&sortBy=${sortBy}`,
        )
        const data = await response.json()

        if (data.success) {
          setUsers(data.data.users)
        }
      } catch (error) {
        console.error('Error fetching top users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchTopUsers()
  }, [period, limit, sortBy])

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'cost', label: t('liaAnalyticsWidgets.topUsers.sort.cost') },
    { value: 'tokens', label: t('liaAnalyticsWidgets.topUsers.sort.tokens') },
    { value: 'messages', label: t('liaAnalyticsWidgets.topUsers.sort.messages') },
    { value: 'conversations', label: t('liaAnalyticsWidgets.topUsers.sort.conversations') },
  ]

  if (isLoading || externalLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
              <div className="flex-1">
                <div className="mb-1 h-4 w-1/2 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                <div className="h-3 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
              </div>
            </div>
          ))}
        </div>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <UsersIcon className="h-5 w-5" style={{ color: theme.action }} />
          {t('liaAnalyticsWidgets.topUsers.title')}
        </h3>
        <AdminSelect
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortBy)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
      </div>

      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map((item) => (
            <div
              key={item.user?.id || item.rank}
              className="flex items-center gap-3 rounded-xl p-3 transition-opacity hover:opacity-85"
              style={{ backgroundColor: theme.surfaceSubtle }}
            >
              <RankBadge rank={item.rank} />

              {item.user?.avatar ? (
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.actionSurface, color: theme.action }}
                >
                  <UserCircleIcon className="h-6 w-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                  {item.user?.name || t('liaAnalyticsWidgets.topUsers.unknownUser')}
                </p>
                <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                  {item.user?.email || t('liaAnalyticsWidgets.topUsers.noEmail')}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: theme.action }}>
                  ${item.stats.cost.toFixed(4)}
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  {t('liaAnalyticsWidgets.topUsers.tokenValue', { value: formatNumber(item.stats.tokens) })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.topUsers.empty')}
        </div>
      )}
    </AdminSurface>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const theme = useAdminTheme()
  const isFirst = rank === 1

  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        backgroundColor: isFirst ? theme.warningSurface : theme.actionSurface,
        color: isFirst ? theme.warning : theme.action,
      }}
    >
      {isFirst ? <TrophyIcon className="h-4 w-4" /> : rank}
    </div>
  )
}
