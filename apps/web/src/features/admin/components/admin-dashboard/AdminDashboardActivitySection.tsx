'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { PanelSectionTitle } from '@/core/components/panel'

import type {
  AdminDashboardActivityItem,
  AdminDashboardThemeColors,
} from './types'

function getActivityTypeColor(
  type: AdminDashboardActivityItem['type'],
  themeColors: AdminDashboardThemeColors
) {
  switch (type) {
    case 'user':
      return themeColors.primary
    case 'workshop':
      return themeColors.secondary
    case 'ai-app':
      return themeColors.accent
    case 'news':
      return 'var(--color-warning)'
    default:
      return themeColors.borderColor
  }
}

function AdminDashboardActivityItemRow({
  activity,
  delay,
  themeColors,
}: {
  activity: AdminDashboardActivityItem
  delay: number
  themeColors: AdminDashboardThemeColors
}) {
  const { t } = useTranslation(['common', 'admin'])
  
  const metadata = useMemo(() => {
    if (!activity.metadata) return {}
    if (typeof activity.metadata === 'string') {
      try {
        return JSON.parse(activity.metadata)
      } catch (e) {
        return {}
      }
    }
    return activity.metadata as Record<string, unknown>
  }, [activity.metadata])

  const titleKey = activity.title
  const descKey = activity.description
  const isLocalized = !!metadata?.is_localized || titleKey?.startsWith('notifications.')
  
  const rawLocation = metadata?.location || metadata?.ip
  const location = typeof rawLocation === 'string' && rawLocation.trim()
    ? rawLocation
    : t('notifications.unknownLocation', { defaultValue: 'Ubicacion desconocida' })

  // Try to resolve title
  const displayTitle = isLocalized
    ? String(t(titleKey, { ...metadata, location, ns: 'common' }))
    : titleKey

  // Try to resolve description
  const displayDescription = (isLocalized || descKey?.startsWith('notifications.'))
    ? String(t(descKey, { ...metadata, location, ns: 'common' }))
    : descKey

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 rounded-xl border-l-2 border-transparent p-4 transition-all duration-200 hover:border-[var(--org-accent-color)] hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
      initial={{ opacity: 0, x: -20 }}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
    >
      <div
        className="mt-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: getActivityTypeColor(activity.type, themeColors) }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h4
            className="truncate text-sm font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            {displayTitle}
          </h4>
          <div
            className="flex items-center gap-1 whitespace-nowrap text-xs"
            style={{ color: themeColors.textSecondary }}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {activity.timestamp}
          </div>
        </div>
        <p className="mt-1 line-clamp-1 text-xs" style={{ color: themeColors.textSecondary }}>
          {displayDescription}
        </p>
        <p className="mt-1 text-xs font-medium" style={{ color: themeColors.accent }}>
          {t('admin:dashboard.activityBy')} {activity.user}
        </p>
      </div>
    </motion.div>
  )
}

export function AdminDashboardActivitySection({
  activities,
  isLoading,
  themeColors,
}: {
  activities: AdminDashboardActivityItem[]
  isLoading: boolean
  themeColors: AdminDashboardThemeColors
}) {
  const { t } = useTranslation('admin')
  const panelTheme = {
    accent: themeColors.accent,
    borderColor: themeColors.borderColor,
    cardBg: themeColors.cardBackground,
    inputBg: themeColors.inputBg,
    isLightMode: themeColors.isLightMode,
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    subtext: themeColors.textSecondary,
    text: themeColors.textPrimary,
  }

  return (
    <section id="tour-activity-section">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <PanelSectionTitle
          title={t('dashboard.activityTitle')}
          subtitle={t('dashboard.activitySubtitle')}
          theme={panelTheme}
        />
      </motion.div>

      <motion.div
        id="tour-activity-card"
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border"
        initial={{ opacity: 0, y: 20 }}
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.isLightMode
            ? 'var(--color-gray-200)'
            : 'color-mix(in srgb, var(--color-bg-light) 4%, transparent)',
        }}
        transition={{ delay: 0.7 }}
      >
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex animate-pulse gap-4">
                <div
                  className="mt-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: themeColors.borderColor }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ backgroundColor: themeColors.borderColor }}
                  />
                  <div
                    className="h-3 w-1/2 rounded"
                    style={{ backgroundColor: themeColors.borderColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: themeColors.textSecondary, opacity: 0.3 }}
            />
            <p style={{ color: themeColors.textSecondary }}>
              {t('dashboard.activityEmpty')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  borderBottom:
                    index < activities.length - 1
                      ? `1px solid ${themeColors.isLightMode ? 'var(--color-gray-200)' : 'color-mix(in srgb, var(--color-bg-light) 4%, transparent)'}`
                      : 'none',
                }}
              >
                <AdminDashboardActivityItemRow
                  activity={activity}
                  delay={index}
                  themeColors={themeColors}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
