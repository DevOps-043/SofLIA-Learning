'use client'

import type { TFunction } from 'i18next'
import { BarChart3, Edit3, Trash2 } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUserCardActionsProps {
  onEdit: () => void
  onDelete: () => void
  onViewStats: () => void
  t: TFunction<'admin'>
  tc: TFunction<'common'>
}

export function AdminUserCardActions({ onEdit, onDelete, onViewStats, t, tc }: AdminUserCardActionsProps) {
  const theme = useAdminPanelTheme()
  return (
    <div className="mt-auto flex items-center justify-center gap-2 pt-5">
      {/* Stats */}
      <button
        type="button"
        onClick={onViewStats}
        className="group/btn inline-flex h-10 items-center justify-center gap-0 rounded-xl px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:gap-2 hover:px-4"
        style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
        title={t('users.actions.viewStats')}
      >
        <BarChart3 className="h-4 w-4 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/btn:max-w-[8rem] group-hover/btn:opacity-100">
          {t('users.actions.viewStats')}
        </span>
      </button>

      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        className="group/btn inline-flex h-10 items-center justify-center gap-0 rounded-xl border px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:gap-2 hover:px-4"
        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
        title={tc('actions.edit')}
      >
        <Edit3 className="h-4 w-4 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/btn:max-w-[8rem] group-hover/btn:opacity-100">
          {tc('actions.edit')}
        </span>
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="group/btn inline-flex h-10 items-center justify-center gap-0 rounded-xl border px-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:gap-2 hover:px-4"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`,
          borderColor: `color-mix(in srgb, ${theme.dangerColor} 18.8%, transparent)`,
          color: theme.dangerColor,
        }}
        title={tc('actions.delete')}
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/btn:max-w-[8rem] group-hover/btn:opacity-100">
          {tc('actions.delete')}
        </span>
      </button>
    </div>
  )
}

