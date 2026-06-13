'use client'

/* eslint-disable no-restricted-syntax -- Color picker: the hex values are user-selectable swatch data (colors applied to the user's text/highlight), not hardcoded UI theme colors. */

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { Ban, Baseline, Highlighter } from 'lucide-react'

import { cn } from '@/utils/cn'

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
    <div className="relative">
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 flex-col items-center justify-center gap-0.5 rounded-md text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
      >
        <Icon className="h-4 w-4" />
        <span
          className="h-1 w-4 rounded-full"
          style={{
            backgroundColor:
              current ?? (mode === 'text' ? 'currentColor' : '#FEF08A'),
          }}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[var(--color-gray-800)]">
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => apply(color)}
                  title={color}
                  aria-label={color}
                  style={{ backgroundColor: color }}
                  className={cn(
                    'h-6 w-6 rounded border border-black/10',
                    current?.toLowerCase() === color.toLowerCase() &&
                      'ring-2 ring-[var(--color-accent)] ring-offset-1 dark:ring-offset-gray-800',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={clear}
              className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
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
