'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type {
  BusinessUserStatsHeaderProps,
  BusinessUserStatsTheme,
} from './types'

export function BusinessUserStatsTabButton({
  isActive,
  onClick,
  label,
  icon: Icon,
  theme,
}: {
  isActive: boolean
  onClick: () => void
  label: string
  icon: LucideIcon
  theme: BusinessUserStatsTheme
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? ''
          : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
      style={
        isActive
          ? {
              backgroundColor: theme.isDark
                ? `${theme.primaryColor}30`
                : `${theme.primaryColor}20`,
              color: theme.isDark ? '#FFFFFF' : theme.primaryColor,
              border: `1px solid ${theme.primaryColor}60`,
              fontWeight: '600',
            }
          : {}
      }
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export function BusinessUserStatsHeader({
  activeTab,
  onChangeTab,
  onClose,
  tabs,
  theme,
}: BusinessUserStatsHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-3 lg:p-4 border-b shrink-0"
      style={{ borderColor: theme.modalBorder }}
    >
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <BusinessUserStatsTabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => onChangeTab(tab.id)}
            label={tab.label}
            icon={tab.icon}
            theme={theme}
          />
        ))}
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <X className="w-5 h-5 text-gray-400 dark:text-white/40" />
      </button>
    </div>
  )
}

export function BusinessUserStatsMetricCard({
  icon: Icon,
  label,
  value,
  iconColor,
  delay = 0,
}: {
  icon: LucideIcon
  label: string
  value: number | string | null | undefined
  iconColor: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl p-4 group cursor-default border"
      style={{
        background: `linear-gradient(135deg, ${iconColor}15, ${iconColor}05)`,
        borderColor: `${iconColor}30`,
      }}
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ backgroundColor: iconColor }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">
        {value !== undefined && value !== null ? value : '-'}
      </div>
      <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/50">
        {label}
      </div>
    </motion.div>
  )
}

export function BusinessUserStatsEmptyState({
  icon: Icon,
  label,
  theme,
}: {
  icon: LucideIcon
  label: string
  theme: BusinessUserStatsTheme
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
        }}
      >
        <Icon
          className="w-8 h-8"
          style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF' }}
        />
      </div>
      <p style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }}>{label}</p>
    </div>
  )
}
