'use client'

import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import { UserStatsSurfaceCard } from './UserStatsSurfaceCard'

interface UserStatsMetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accentColor: string
}

export function UserStatsMetricCard({
  label,
  value,
  icon: Icon,
  accentColor,
}: UserStatsMetricCardProps) {
  const theme = useAdminPanelTheme()

  return (
    <UserStatsSurfaceCard className="h-full p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.mutedTextColor }}>
            {label}
          </p>
          <p className="text-3xl font-semibold" style={{ color: theme.textColor }}>
            {value}
          </p>
        </div>

        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl border"
          style={{ color: accentColor, borderColor: theme.borderColor, backgroundColor: theme.inputBg }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </UserStatsSurfaceCard>
  )
}
