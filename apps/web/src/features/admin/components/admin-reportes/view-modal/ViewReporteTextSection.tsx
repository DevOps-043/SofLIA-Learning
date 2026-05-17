'use client'

import type { ReactNode } from 'react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface ViewReporteTextSectionProps {
  title: string
  children: ReactNode
}

export function ViewReporteTextSection({ title, children }: ViewReporteTextSectionProps) {
  const theme = useAdminPanelTheme()

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.mutedTextColor }}>{title}</h3>
      <div className="rounded-2xl border p-4 text-sm leading-6" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
        {children}
      </div>
    </section>
  )
}
