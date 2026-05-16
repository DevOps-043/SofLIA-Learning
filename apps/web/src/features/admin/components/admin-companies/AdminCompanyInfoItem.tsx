'use client'

import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminCompanyInfoItemProps {
  icon: LucideIcon
  label: string
  value: string
}

export function AdminCompanyInfoItem({
  icon: Icon,
  label,
  value,
}: AdminCompanyInfoItemProps) {
  const theme = useAdminPanelTheme()
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>{label}</p>
        <p className="break-all text-sm font-semibold" style={{ color: theme.textColor }}>{value}</p>
      </div>
    </div>
  )
}
