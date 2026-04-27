'use client'

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminMetricCard, AdminSurface } from '../ui'

interface LiaAnalyticsSummary {
  totalConversations: number
  totalMessages: number
  totalTokens: number
  totalCostUsd: number
  avgResponseTimeMs: number
  completedActivities: number
}

interface TodayStats {
  cost: number
  tokens: number
  messages: number
  costChange: number
  activeUsers: number
  usersChange: number
}

interface EfficiencyStats {
  avgMessagesPerConversation: number
  avgCostPerMessage: number
}

interface LiaStatsCardsProps {
  summary: LiaAnalyticsSummary
  today: TodayStats
  efficiency: EfficiencyStats
  projectedMonthlyCost: number
  isLoading?: boolean
}

function formatCurrency(value: number) {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`
  }
  if (value < 1) {
    return `$${value.toFixed(3)}`
  }
  return `$${value.toFixed(2)}`
}

function formatNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

function formatTime(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

export function LiaStatsCards({
  summary,
  today,
  efficiency,
  projectedMonthlyCost,
  isLoading,
}: LiaStatsCardsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  const stats = [
    {
      id: 'today-cost',
      name: t('liaAnalyticsWidgets.stats.todayCost'),
      value: formatCurrency(today.cost),
      change: today.costChange,
      changeLabel: t('liaAnalyticsWidgets.stats.vsYesterday'),
      icon: CurrencyDollarIcon,
      positiveIsGood: false,
    },
    {
      id: 'total-cost',
      name: t('liaAnalyticsWidgets.stats.totalCost'),
      value: formatCurrency(summary.totalCostUsd),
      subValue: t('liaAnalyticsWidgets.stats.monthlyProjection', {
        value: formatCurrency(projectedMonthlyCost),
      }),
      icon: CurrencyDollarIcon,
    },
    {
      id: 'tokens',
      name: t('liaAnalyticsWidgets.stats.tokens'),
      value: formatNumber(summary.totalTokens),
      subValue: t('liaAnalyticsWidgets.stats.todayValue', { value: formatNumber(today.tokens) }),
      icon: BoltIcon,
    },
    {
      id: 'conversations',
      name: t('liaAnalyticsWidgets.stats.conversations'),
      value: formatNumber(summary.totalConversations),
      subValue: t('liaAnalyticsWidgets.stats.messages', { value: formatNumber(summary.totalMessages) }),
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: 'avg-time',
      name: t('liaAnalyticsWidgets.stats.avgTime'),
      value: formatTime(summary.avgResponseTimeMs),
      subValue: t('liaAnalyticsWidgets.stats.response'),
      icon: ClockIcon,
    },
    {
      id: 'active-users',
      name: t('liaAnalyticsWidgets.stats.activeUsersToday'),
      value: formatNumber(today.activeUsers || 0),
      change: today.usersChange || 0,
      changeLabel: t('liaAnalyticsWidgets.stats.vsYesterday'),
      icon: UsersIcon,
      positiveIsGood: true,
    },
    {
      id: 'messages-per-conversation',
      name: t('liaAnalyticsWidgets.stats.messagesPerConversation'),
      value: (efficiency?.avgMessagesPerConversation || 0).toFixed(1),
      subValue: t('liaAnalyticsWidgets.stats.interactionAverage'),
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: 'cost-per-message',
      name: t('liaAnalyticsWidgets.stats.costPerMessage'),
      value: formatCurrency(efficiency?.avgCostPerMessage || 0),
      subValue: t('liaAnalyticsWidgets.stats.messageEfficiency'),
      icon: CalculatorIcon,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {[...Array(8)].map((_, index) => (
          <AdminSurface key={index} className="h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {stats.map((stat) => {
        const hasChange = stat.change !== undefined
        const changeIsGood = hasChange && (stat.positiveIsGood ? stat.change! >= 0 : stat.change! <= 0)
        const TrendIcon = !hasChange
          ? null
          : stat.change! >= 0
            ? ArrowTrendingUpIcon
            : ArrowTrendingDownIcon

        return (
          <AdminMetricCard
            key={stat.id}
            icon={stat.icon}
            label={stat.name}
            value={stat.value}
            tone="info"
            className="min-h-[112px]"
            description={
              hasChange && TrendIcon ? (
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: changeIsGood ? theme.action : theme.danger }}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {stat.change! >= 0 ? '+' : ''}
                  {stat.change}%
                  <span style={{ color: theme.textMuted }}>{stat.changeLabel}</span>
                </span>
              ) : (
                stat.subValue
              )
            }
          />
        )
      })}
    </div>
  )
}
