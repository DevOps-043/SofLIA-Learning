'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Loader2, RefreshCw } from 'lucide-react'

interface CompendiumActionsPanelProps {
  isRegenerating: boolean
  onRegenerate: () => void
  actionColor: string
  onActionColor: string
  subtextColor: string
  courseId: string
  orgSlug: string
}

/**
 * Actions for the read-only SofLIA course compendium: regenerate (with inline
 * confirmation — it replaces the current content) and delete.
 */
export function CompendiumActionsPanel({
  isRegenerating,
  onRegenerate,
  actionColor,
  onActionColor,
  subtextColor,
  courseId,
  orgSlug,
}: CompendiumActionsPanelProps) {
  const { t } = useTranslation('notebook')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

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

      <a
        href={`/api/${encodeURIComponent(orgSlug)}/business-user/notebook/compendium/${encodeURIComponent(courseId)}/export`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ borderColor: actionColor, color: actionColor }}
      >
        <Download className="h-4 w-4" />
        {t('compendium.exportPdf')}
      </a>

    </div>
  )
}
