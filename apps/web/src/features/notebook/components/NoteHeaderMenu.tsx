'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, MoreHorizontal, Tag, Trash2 } from 'lucide-react'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { TagInput } from './TagInput'

interface NoteHeaderMenuProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  onDelete: () => void | Promise<void>
  isDeleting: boolean
}

/**
 * Menú compacto "···" del encabezado del editor. Aloja Etiquetas y Eliminar,
 * que antes vivían en el rail derecho (ahora dedicado a SofLIA). El guardado es
 * automático, por eso no hay botón de guardar.
 */
export function NoteHeaderMenu({
  tags,
  onTagsChange,
  onDelete,
  isDeleting,
}: NoteHeaderMenuProps) {
  const { t } = useTranslation('notebook')
  const theme = useBusinessPanelTheme()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('editor.moreActions')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors hover:opacity-80"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 rounded-xl border p-3 shadow-xl"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <p
            className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: theme.mutedTextColor }}
          >
            <Tag className="h-3.5 w-3.5" />
            {t('editor.tagsLabel')}
          </p>
          <TagInput tags={tags} onChange={onTagsChange} />

          <div className="mt-3 border-t pt-3" style={{ borderColor: theme.borderColor }}>
            {confirmDelete ? (
              <div className="flex flex-col gap-2 rounded-lg bg-red-500/5 p-2">
                <p className="px-1 text-xs" style={{ color: theme.subtextColor }}>
                  {t('editor.confirmDeletePrompt')}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onDelete()}
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
                    style={{ color: theme.subtextColor }}
                  >
                    {t('editor.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                {t('editor.delete')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
