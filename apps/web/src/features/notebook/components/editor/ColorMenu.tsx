'use client'

/* eslint-disable no-restricted-syntax -- Color picker: the hex values are user-selectable swatch data (colors applied to the user's text/highlight), not hardcoded UI theme colors. */

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { Ban, Baseline, Highlighter } from 'lucide-react'

import { cn } from '@/utils/cn'
import styles from '../NotebookEditor.module.css'

interface ColorMenuProps {
  editor: Editor
  mode: 'text' | 'highlight'
}

const TEXT_COLORS = [
  '#111827', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#10B981', '#14B8A6', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#EC4899', '#FFFFFF',
]

const HIGHLIGHT_COLORS = [
  '#FEF08A', '#FDE68A', '#FED7AA', '#FECACA',
  '#BBF7D0', '#A7F3D0', '#BFDBFE', '#DDD6FE',
  '#FBCFE8', '#E5E7EB',
]

/**
 * Color palette popover for text color or highlight. Applies the chosen color
 * via TipTap's Color / Highlight extensions and renders the current color as a
 * small underline indicator on the trigger button.
 */
export function ColorMenu({ editor, mode }: ColorMenuProps) {
  const { t } = useTranslation('notebook')
  const [open, setOpen] = useState(false)

  const colors = mode === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS
  const current =
    mode === 'text'
      ? (editor.getAttributes('textStyle').color as string | undefined)
      : (editor.getAttributes('highlight').color as string | undefined)

  const Icon = mode === 'text' ? Baseline : Highlighter
  const label =
    mode === 'text'
      ? t('editor.toolbar.textColor')
      : t('editor.toolbar.highlight')

  const apply = (color: string) => {
    if (mode === 'text') {
      editor.chain().focus().setColor(color).run()
    } else {
      editor.chain().focus().toggleHighlight({ color }).run()
    }
    setOpen(false)
  }

  const clear = () => {
    if (mode === 'text') {
      editor.chain().focus().unsetColor().run()
    } else {
      editor.chain().focus().unsetHighlight().run()
    }
    setOpen(false)
  }

  return (
    <div className={styles.colorMenu}>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(styles.colorTrigger, open && styles.colorTriggerOpen)}
      >
        <Icon />
        <span
          className={styles.colorIndicator}
          style={{
            backgroundColor:
              current ?? (mode === 'text' ? 'currentColor' : '#FEF08A'),
          }}
        />
      </button>

      {open && (
        <>
          <div
            className={styles.colorOverlay}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className={styles.colorPopover}>
            <div className={styles.colorGrid}>
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => apply(color)}
                  title={color}
                  aria-label={color}
                  style={{ backgroundColor: color }}
                  className={cn(
                    styles.colorSwatch,
                    current?.toLowerCase() === color.toLowerCase() &&
                      styles.colorSwatchActive,
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={clear}
              className={styles.colorClear}
            >
              <Ban className="h-3.5 w-3.5" />
              {t('editor.toolbar.removeColor')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
