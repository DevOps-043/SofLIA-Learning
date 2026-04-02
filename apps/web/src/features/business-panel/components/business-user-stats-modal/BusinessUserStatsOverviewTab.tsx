'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  HelpCircle,
  MessageSquare,
  PlayCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  shouldShowBusinessUserPlatformActivity,
} from '../../services/business-user-stats-display.service'
import { BusinessUserStatsMetricCard } from './shared'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsOverviewTab({
  stats,
  t,
  theme,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme'>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            icon: BookOpen,
            label: t('users.stats.cards.courses'),
            value: stats.total_courses,
            iconColor: theme.primaryColor,
          },
          {
            icon: CheckCircle,
            label: t('users.stats.cards.completed'),
            value: stats.completed_courses,
            iconColor: theme.accentColor,
          },
          {
            icon: Clock,
            label: t('users.stats.cards.hours'),
            value: stats.total_time_spent_hours,
            iconColor: theme.secondaryColor,
          },
          {
            icon: Award,
            label: t('users.stats.cards.certificates'),
            value: stats.certificates_count,
            iconColor: theme.primaryColor,
          },
        ].map((item, index) => (
          <BusinessUserStatsMetricCard key={item.label} {...item} delay={index * 0.1} />
        ))}
      </div>

      {shouldShowBusinessUserPlatformActivity(stats) ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-medium text-gray-600 dark:text-white/70 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: theme.primaryColor }} />
            {t('users.stats.platformActivity.title')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {stats.lia_conversations_total !== undefined ? (
              <ActivityCard
                icon={MessageSquare}
                value={stats.lia_conversations_total}
                label={t('users.stats.platformActivity.liaQueries')}
                helper={
                  stats.lia_messages_total !== undefined
                    ? `${stats.lia_messages_total} ${t('users.stats.platformActivity.messages')}`
                    : undefined
                }
                color={theme.primaryColor}
                theme={theme}
              />
            ) : null}
            {stats.quiz_total !== undefined && stats.quiz_total > 0 ? (
              <ActivityCard
                icon={HelpCircle}
                value={`${stats.quiz_passed || 0}/${stats.quiz_total}`}
                label={t('users.stats.platformActivity.quizzesPassed')}
                helper={
                  stats.quiz_average_score !== undefined
                    ? `${stats.quiz_average_score}% ${t('users.stats.platformActivity.average')}`
                    : undefined
                }
                color={theme.accentColor}
                theme={theme}
              />
            ) : null}
            {stats.lia_activities_completed !== undefined ? (
              <ActivityCard
                icon={Zap}
                value={stats.lia_activities_completed}
                label={t('users.stats.platformActivity.liaActivities')}
                helper={
                  stats.lia_activities_total !== undefined
                    ? `de ${stats.lia_activities_total} ${t('users.stats.platformActivity.total')}`
                    : undefined
                }
                color={theme.isDark ? '#F43F5E' : '#E11D48'}
                theme={theme}
              />
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-5 border"
        style={{
          background: theme.isDark
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent)'
            : '#E9ECEF',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-white/70">
              {t('users.stats.generalProgress.title')}
            </h3>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
              {t('users.stats.generalProgress.subtitle')}
            </p>
          </div>
          <div className="text-3xl font-bold" style={{ color: theme.primaryColor }}>
            {stats.average_progress}%
          </div>
        </div>

        <div className="relative h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-white/5 mb-5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.average_progress}%` }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}CC)`,
              boxShadow: `0 0 20px ${theme.primaryColor}60`,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <ProgressCard
            icon={CheckCircle}
            value={stats.completed_courses}
            label={t('users.stats.generalProgress.completed')}
            color={theme.isDark ? '#10B981' : '#059669'}
            theme={theme}
          />
          <ProgressCard
            icon={PlayCircle}
            value={stats.in_progress_courses}
            label={t('users.stats.generalProgress.inProgress')}
            color={theme.isDark ? '#3B82F6' : '#2563EB'}
            theme={theme}
          />
          <ProgressCard
            icon={XCircle}
            value={stats.not_started_courses}
            label={t('users.stats.generalProgress.notStarted')}
            color={theme.isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D'}
            theme={theme}
          />
        </div>
      </motion.div>
    </div>
  )
}

function ActivityCard({
  icon: Icon,
  value,
  label,
  helper,
  color,
  theme,
}: {
  icon: typeof MessageSquare
  value: number | string
  label: string
  helper?: string
  color: string
  theme: BusinessUserStatsTabProps['theme']
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 border"
      style={{
        background: theme.isDark
          ? `linear-gradient(135deg, ${color}20, ${color}05)`
          : `linear-gradient(135deg, ${color}15, ${color}05)`,
        borderColor: theme.isDark ? `${color}40` : `${color}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          <div className="text-xs text-gray-500 dark:text-white/50">{label}</div>
        </div>
      </div>
      {helper ? <div className="mt-2 text-xs" style={{ color }}>{helper}</div> : null}
    </div>
  )
}

function ProgressCard({
  icon: Icon,
  value,
  label,
  color,
  theme,
}: {
  icon: typeof CheckCircle
  value: number
  label: string
  color: string
  theme: BusinessUserStatsTabProps['theme']
}) {
  return (
    <div
      className="text-center p-3 rounded-xl border"
      style={{
        background: theme.isDark ? `${color}20` : '#E9ECEF',
        borderColor: theme.isDark ? `${color}33` : '#6C757D',
      }}
    >
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
        style={{ backgroundColor: theme.isDark ? `${color}33` : `${color}26` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>
        {label}
      </div>
    </div>
  )
}
