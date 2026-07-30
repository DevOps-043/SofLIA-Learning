'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, MoreHorizontal, Tag, Trash2 } from 'lucide-react'

import { TagInput } from './TagInput'
import styles from './NotebookEditor.module.css'

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
    <div ref={containerRef} className={styles.headerMenuRoot}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('editor.moreActions')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={styles.headerMenuTrigger}
      >
        <MoreHorizontal />
      </button>

      {open && (
        <div
          role="menu"
          className={styles.headerMenu}
        >
          <p className={styles.headerMenuLabel}>
            <Tag />
            {t('editor.tagsLabel')}
          </p>
          <TagInput tags={tags} onChange={onTagsChange} />

          <div className={styles.headerMenuDangerZone}>
            {confirmDelete ? (
              <div className={styles.deleteConfirm}>
                <p>
                  {t('editor.confirmDeletePrompt')}
                </p>
                <div className={styles.deleteConfirmActions}>
                  <button
                    type="button"
                    onClick={() => void onDelete()}
                    disabled={isDeleting}
                    className={styles.deleteConfirmButton}
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
                    className={styles.deleteCancelButton}
                  >
                    {t('editor.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={styles.deleteButton}
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
