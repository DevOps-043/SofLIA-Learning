'use client'

import type { LucideIcon } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUserIconButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}

export function AdminUserIconButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: AdminUserIconButtonProps) {
  const theme = useAdminPanelTheme()
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors" style={{ backgroundColor: danger ? `${theme.dangerColor}12` : theme.inputBg, borderColor: danger ? `${theme.dangerColor}30` : theme.borderColor, color: danger ? theme.dangerColor : theme.textColor }} aria-label={label} title={label}>
      <Icon className="h-4 w-4" />
    </button>
  )
}
