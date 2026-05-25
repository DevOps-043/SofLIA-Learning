'use client'

import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserProgressSidebarStatProps {
  icon: LucideIcon
  label: string
  value: string
}

export function UserProgressSidebarStat({ icon: Icon, label, value }: UserProgressSidebarStatProps) {
  const theme = useAdminPanelTheme()

  return (
    <div className="flex items-center justify-between rounded-2xl border px-3 py-2" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}>
      <div className="flex items-center gap-2"><Icon className="h-4 w-4" style={{ color: theme.mutedTextColor }} /><span className="text-sm" style={{ color: theme.subtextColor }}>{label}</span></div>
      <span className="text-sm font-semibold" style={{ color: theme.textColor }}>{value}</span>
    </div>
  )
}
