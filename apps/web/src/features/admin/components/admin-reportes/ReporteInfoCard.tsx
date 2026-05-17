'use client'

import type { ReactNode } from 'react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface ReporteInfoCardProps {
  label: string
  children: ReactNode
}

export function ReporteInfoCard({ label, children }: ReporteInfoCardProps) {
  const theme = useAdminPanelTheme()

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{label}</p>
      <div className="text-sm font-medium" style={{ color: theme.textColor }}>{children}</div>
    </div>
  )
}
