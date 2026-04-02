'use client'

import { motion } from 'framer-motion'
import { Activity, Award, BookOpen, Calendar, Clock, FileText, Target } from 'lucide-react'
import {
  buildBusinessUserStatsCompletionBars,
} from '../../services/business-user-stats-display.service'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsActivityTab({
  stats,
  t,
  theme,
  formatMonth,
}: BusinessUserStatsTabProps) {
  const completionBars = buildBusinessUserStatsCompletionBars(stats.completed_by_month)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          icon={FileText}
          value={stats.notes_count}
          label={t('users.stats.activity.notesCreated')}
          color={theme.isDark ? '#10B981' : '#059669'}
          theme={theme}
        />
        <SummaryCard
          icon={Target}
          value={`${stats.completed_assignments}/${stats.total_assignments}`}
          label={t('users.stats.activity.assignments')}
          color={theme.isDark ? '#3B82F6' : '#2563EB'}
          theme={theme}
        />
        <SummaryCard
          icon={Award}
          value={stats.certificates_count}
          label={t('users.stats.activity.certificates')}
          color={theme.isDark ? '#F59E0B' : '#D97706'}
          theme={theme}
        />
      </div>

      {completionBars.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border p-5"
          style={{
            background: theme.isDark
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
              : '#E9ECEF',
            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" style={{ color: theme.primaryColor }} />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('users.stats.activity.completionHistory')}
            </h3>
          </div>

          <div className="space-y-3">
            {completionBars.map((item, index) => (
              <motion.div
                key={item.month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-20 text-xs flex-shrink-0 text-gray-500 dark:text-white/70">
                  {formatMonth(item.month)}
                </div>
                <div className="flex-1 relative h-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                    className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3"
                    style={{
                      background: `linear-gradient(90deg, ${theme.primaryColor}40, ${theme.primaryColor}80)`,
                      minWidth: '60px',
                    }}
                  >
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {item.count} {t('users.stats.activity.courses')}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border p-5"
        style={{
          background: theme.isDark
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
            : '#E9ECEF',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" style={{ color: theme.primaryColor }} />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t('users.stats.activity.summary')}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InlineMetric
            icon={Clock}
            value={`${stats.total_time_spent_hours}h`}
            label={t('users.stats.activity.studyTime')}
            theme={theme}
          />
          <InlineMetric
            icon={BookOpen}
            value={`${stats.completed_lessons}/${stats.total_lessons}`}
            label={t('users.stats.activity.lessons')}
            theme={theme}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

function SummaryCard({
  icon: Icon,
  value,
  label,
  color,
  theme,
}: {
  icon: typeof FileText
  value: number | string
  label: string
  color: string
  theme: BusinessUserStatsTabProps['theme']
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 border"
      style={{
        background: theme.isDark ? `${color}20` : '#E9ECEF',
        borderColor: theme.isDark ? `${color}40` : '#6C757D',
      }}
    >
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: theme.isDark ? `${color}33` : `${color}26` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm" style={{ color }}>
        {label}
      </div>
    </motion.div>
  )
}

function InlineMetric({
  icon: Icon,
  value,
  label,
  theme,
}: {
  icon: typeof Clock
  value: string
  label: string
  theme: BusinessUserStatsTabProps['theme']
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{
        background: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9ECEF',
        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D',
      }}
    >
      <Icon
        className="w-5 h-5"
        style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : '#6C757D' }}
      />
      <div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-500 dark:text-white/50">{label}</div>
      </div>
    </div>
  )
}
