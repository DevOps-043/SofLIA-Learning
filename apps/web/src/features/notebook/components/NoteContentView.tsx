'use client'

import { useMemo } from 'react'

import {
  normalizeGeneratedNoteHtml,
  normalizeNoteContentHtml,
} from '@/lib/notes/generated-note-html'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { cn } from '@/utils/cn'
import {
  NOTEBOOK_MAX_CONTENT_LENGTH,
  type NotebookNoteSource,
} from '../types'

interface NoteContentViewProps {
  html: string
  className?: string
  source?: NotebookNoteSource
}

/**
 * Read-only renderer for note HTML. Content is already sanitized on save, but
 * we re-sanitize on render (defense-in-depth) before injecting it.
 */
export function NoteContentView({ html, className, source }: NoteContentViewProps) {
  const safeHtml = useMemo(
    () => {
      const formattedHtml =
        source === 'lesson_auto_note' || source === 'course_compendium'
          ? normalizeGeneratedNoteHtml(html, source)
          : normalizeNoteContentHtml(html)

      return sanitizeHtml(formattedHtml ?? '', {
        level: 'rich',
        maxLength: NOTEBOOK_MAX_CONTENT_LENGTH,
      })
    },
    [html, source],
  )

  return (
    <div
      className={cn('notebook-prose', className)}
      // Sanitized immediately above with the same policy used on save.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
