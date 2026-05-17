'use client'

import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

const TONE_COLORS = {
  primary: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
}

interface AdminReportesStatCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone: keyof typeof TONE_COLORS
}

export function AdminReportesStatCard({ label, value, icon: Icon, tone }: AdminReportesStatCardProps) {
  const theme = useAdminPanelTheme()
  const color = TONE_COLORS[tone]

  return (
    <div className="rounded-[24px] border p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.mutedTextColor }}>{label}</p>
          <p className="text-3xl font-semibold" style={{ color: theme.textColor }}>{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ color, borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
