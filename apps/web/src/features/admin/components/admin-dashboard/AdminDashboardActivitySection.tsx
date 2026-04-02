'use client'

import type { ComponentProps, JSX } from 'react'
import { motion } from 'framer-motion'
import { BellAlertIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

import type {
  AdminDashboardActivityItem,
  AdminDashboardThemeColors,
} from './types'

const SafeLink = Link as unknown as (
  props: ComponentProps<typeof Link>
) => JSX.Element

function getActivityTypeColor(type: AdminDashboardActivityItem['type']) {
  switch (type) {
    case 'user':
      return 'bg-[#0A2540] border-[#0A2540]/50'
    case 'workshop':
      return 'bg-[#10B981] border-[#10B981]/50'
    case 'ai-app':
      return 'bg-[#00D4B3] border-[#00D4B3]/50'
    case 'news':
      return 'bg-[#F59E0B] border-[#F59E0B]/50'
    default:
      return 'bg-[#6C757D] border-[#6C757D]/50'
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
  const hoverBackground =
    themeColors.cardBackground === '#FFFFFF' ? '#F1F5F9' : '#1E2329'

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 rounded-xl border-l-2 border-transparent p-4 transition-all duration-300 hover:border-[#00D4B3]"
      initial={{ opacity: 0, x: -20 }}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
      whileHover={{ backgroundColor: hoverBackground, y: -2 }}
    >
      <div className={`mt-2 h-2 w-2 rounded-full ${getActivityTypeColor(activity.type)}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h4
            className="truncate text-sm font-medium"
            style={{ color: themeColors.textPrimary }}
          >
            {activity.title}
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
          {activity.description}
        </p>
        <p className="mt-1 text-xs font-medium text-[#00D4B3]">por {activity.user}</p>
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
  return (
    <section>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>
            Actividad Reciente
          </h2>
          <p className="mt-1 text-sm" style={{ color: themeColors.textSecondary }}>
            Ultimas acciones en la plataforma
          </p>
        </div>
        <SafeLink href="/admin/activity">
          <motion.button
            className="flex items-center gap-2 text-sm font-medium text-[#00D4B3] hover:underline"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <EyeIcon className="h-4 w-4" />
            Ver todo
          </motion.button>
        </SafeLink>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border"
        initial={{ opacity: 0, y: 20 }}
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: `${themeColors.borderColor}20`,
        }}
        transition={{ delay: 0.7 }}
      >
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex gap-4 animate-pulse">
                <div
                  className="mt-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: `${themeColors.textSecondary}30` }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 w-3/4 rounded"
                    style={{ backgroundColor: `${themeColors.textSecondary}20` }}
                  />
                  <div
                    className="h-3 w-1/2 rounded"
                    style={{ backgroundColor: `${themeColors.textSecondary}20` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <BellAlertIcon
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: `${themeColors.textSecondary}50` }}
            />
            <p style={{ color: themeColors.textSecondary }}>
              No hay actividad reciente
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity, index) => (
              <AdminDashboardActivityItemRow
                key={activity.id}
                activity={activity}
                delay={index}
                themeColors={themeColors}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  )
}
