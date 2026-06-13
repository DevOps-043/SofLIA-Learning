'use client'

import { useMemo } from 'react'

import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { cn } from '@/utils/cn'
import { NOTEBOOK_MAX_CONTENT_LENGTH } from '../types'

interface NoteContentViewProps {
  html: string
  className?: string
}

/**
 * Read-only renderer for note HTML. Content is already sanitized on save, but
 * we re-sanitize on render (defense-in-depth) before injecting it.
 */
export function NoteContentView({ html, className }: NoteContentViewProps) {
  const safeHtml = useMemo(
    () =>
      sanitizeHtml(html ?? '', {
        level: 'rich',
        maxLength: NOTEBOOK_MAX_CONTENT_LENGTH,
      }),
    [html],
  )

  return (
    <div
      className={cn('notebook-prose', className)}
      // Sanitized immediately above with the same policy used on save.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
