'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { PanelSectionTitle, PanelStatCard } from '@/core/components/panel'

import type {
  AdminDashboardStatIconMap,
  AdminDashboardStatItem,
  AdminDashboardThemeColors,
} from './types'

const statIcons: AdminDashboardStatIconMap = {
  courses: BookOpenIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

export function AdminDashboardStatsSection({
  error,
  isLoading,
  statsData,
  themeColors,
}: {
  error: string | null
  isLoading: boolean
  statsData: AdminDashboardStatItem[]
  themeColors: AdminDashboardThemeColors
}) {
  const { t } = useTranslation('admin')
  const [isStatsOpenMobile, setIsStatsOpenMobile] = useState(false)
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
    <section id="tour-stats-section">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <PanelSectionTitle
          title={t('dashboard.statsTitle')}
          subtitle={t('dashboard.statsSubtitle')}
          theme={panelTheme}
          action={
            <button
              onClick={() => setIsStatsOpenMobile((previous) => !previous)}
              className="flex items-center justify-center rounded-full p-2 transition-colors md:hidden"
              style={{
                backgroundColor: `${themeColors.primary}15`,
                color: themeColors.primary,
              }}
              aria-label="Toggle statistics"
            >
              {isStatsOpenMobile ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          }
        />
      </motion.div>

      <div className={!isStatsOpenMobile ? 'hidden md:block' : 'block'}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-[90px] animate-pulse rounded-2xl md:h-36"
                style={{ backgroundColor: themeColors.cardBackground }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.borderColor,
              color: themeColors.textSecondary,
            }}
          >
            {t('dashboard.statsError', { error })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            {statsData.map((stat, index) => {
              const Icon = statIcons[stat.iconKey]
              return (
                <PanelStatCard
                  key={stat.title}
                  delay={index}
                  href={stat.href}
                  icon={Icon}
                  iconColor={stat.iconColor}
                  theme={panelTheme}
                  title={stat.title}
                  value={stat.value}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
