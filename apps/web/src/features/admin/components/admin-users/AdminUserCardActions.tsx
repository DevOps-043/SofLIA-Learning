'use client'

import type { TFunction } from 'i18next'
import { Edit3, Trash2 } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUserCardActionsProps {
  onEdit: () => void
  onDelete: () => void
  tc: TFunction<'common'>
}

export function AdminUserCardActions({ onEdit, onDelete, tc }: AdminUserCardActionsProps) {
  const theme = useAdminPanelTheme()
  return (
    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
      <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
        <Edit3 className="h-4 w-4" />
        {tc('actions.edit')}
      </button>
      <button type="button" onClick={onDelete} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`, color: theme.dangerColor }}>
        <Trash2 className="h-4 w-4" />
        {tc('actions.delete')}
      </button>
    </div>
  )
}
