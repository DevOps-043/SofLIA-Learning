'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'

interface CompendiumActionsPanelProps {
  isDeleting: boolean
  isRegenerating: boolean
  onDelete: () => void
  onRegenerate: () => void
  actionColor: string
  onActionColor: string
  subtextColor: string
}

/**
 * Actions for the read-only SofLIA course compendium: regenerate (with inline
 * confirmation — it replaces the current content) and delete.
 */
export function CompendiumActionsPanel({
  isDeleting,
  isRegenerating,
  onDelete,
  onRegenerate,
  actionColor,
  onActionColor,
  subtextColor,
}: CompendiumActionsPanelProps) {
  const { t } = useTranslation('notebook')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: subtextColor }}>
        {t('compendium.readOnlyHint')}
      </p>

      {confirmRegenerate ? (
        <div className="flex flex-col gap-2 rounded-lg bg-[var(--color-accent)]/5 p-2">
          <p className="px-1 text-xs" style={{ color: subtextColor }}>
            {t('compendium.regenerateConfirm')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmRegenerate(false)
                onRegenerate()
              }}
              disabled={isRegenerating}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: actionColor, color: onActionColor }}
            >
              <RefreshCw className="h-4 w-4" />
              {t('compendium.regenerate')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegenerate(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:opacity-70"
              style={{ color: subtextColor }}
            >
              {t('editor.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmRegenerate(true)}
          disabled={isRegenerating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: actionColor, color: onActionColor }}
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRegenerating
            ? t('compendium.regenerating')
            : t('compendium.regenerate')}
        </button>
      )}

      {confirmDelete ? (
        <div className="flex flex-col gap-2 rounded-lg bg-red-500/5 p-2">
          <p className="px-1 text-xs" style={{ color: subtextColor }}>
            {t('editor.confirmDeletePrompt')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('editor.confirmDelete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:opacity-70"
              style={{ color: subtextColor }}
            >
              {t('editor.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          {t('editor.delete')}
        </button>
      )}
    </div>
  )
}
