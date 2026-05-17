'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import { UserStatsSurfaceCard } from './UserStatsSurfaceCard'

interface UserStatsChartCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
}

export function UserStatsChartCard({
  title,
  icon: Icon,
  children,
}: UserStatsChartCardProps) {
  const theme = useAdminPanelTheme()

  return (
    <UserStatsSurfaceCard className="min-h-[360px]">
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{ color: theme.primaryColor, borderColor: theme.borderColor, backgroundColor: theme.inputBg }}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: theme.textColor }}>
          {title}
        </h3>
      </div>
      {children}
    </UserStatsSurfaceCard>
  )
}
