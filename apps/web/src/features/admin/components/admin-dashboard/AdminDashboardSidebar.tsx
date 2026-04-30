'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { PanelQuickAction } from '@/core/components/panel'

import type {
  AdminDashboardQuickActionIconMap,
  AdminDashboardQuickActionItem,
  AdminDashboardThemeColors,
} from './types'

const quickActionIcons: AdminDashboardQuickActionIconMap = {
  courses: PlusIcon,
  documents: DocumentTextIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

export function AdminDashboardSidebar({
  quickActions,
  themeColors,
}: {
  quickActions: AdminDashboardQuickActionItem[]
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
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-24"
      initial={{ opacity: 0, x: 20 }}
      transition={{ delay: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
          {t('dashboard.quickActionsTitle')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: themeColors.textSecondary }}>
          {t('dashboard.quickActionsSubtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {quickActions.map((action, index) => {
          const Icon = quickActionIcons[action.iconKey]

          return (
            <PanelQuickAction
              key={action.title}
              delay={index}
              description={action.description}
              href={action.href}
              icon={Icon}
              iconColor={action.color}
              theme={panelTheme}
              title={action.title}
            />
          )
        })}
      </div>
    </motion.div>
  )
}
