'use client'

import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

export function ContextDistributionLoading() {
  const theme = useAdminPanelTheme()

  return (
    <div className="rounded-[24px] border p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mx-auto h-64 w-64 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  )
}
