import type { ReactNode } from 'react'
import type { BusinessPanelTheme } from './types'

export function AssignmentNotice({
  children,
  theme,
}: {
  children: ReactNode
  theme: BusinessPanelTheme
}) {
  return (
    <div
      className="rounded-3xl border border-dashed px-6 py-12 text-center text-sm"
      style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
    >
      {children}
    </div>
  )
}
