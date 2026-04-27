'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminMetricCard, AdminSurface } from '../ui'

export function UserStatsLoadingState() {
  const theme = useAdminTheme()

  return (
    <div className="flex h-64 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: theme.action, borderTopColor: 'transparent' }}
      />
    </div>
  )
}

export function UserStatsErrorState({ message }: { message: string }) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="p-4">
      <p className="text-sm font-semibold" style={{ color: theme.danger }}>
        {message}
      </p>
    </AdminSurface>
  )
}

export function UserStatsMetricCard({
  icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AdminMetricCard icon={icon} label={label} value={value} tone="info" />
    </motion.div>
  )
}

export function UserStatsChartCard({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  const theme = useAdminTheme()

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AdminSurface className="min-h-[350px] p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: theme.actionSurface, color: theme.action }}
          >
            <Icon className="h-5 w-5" />
          </span>
          {title}
        </h3>
        {children}
      </AdminSurface>
    </motion.div>
  )
}
