import type { NotebookItem, NotebookNotesResponse } from '../types'

export type NotebookCursor = {
  id: string
  updatedAt: string
}

export function encodeNotebookCursor(item: NotebookItem): string {
  return Buffer.from(
    JSON.stringify({
      id: item.noteId,
      updatedAt: item.updatedAt,
    }),
    'utf8',
  ).toString('base64url')
}

export function decodeNotebookCursor(rawCursor?: string): NotebookCursor | null {
  if (!rawCursor) return null

  try {
    const parsed = JSON.parse(
      Buffer.from(rawCursor, 'base64url').toString('utf8'),
    ) as Partial<NotebookCursor>

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.updatedAt !== 'string' ||
      Number.isNaN(new Date(parsed.updatedAt).getTime())
    ) {
      return null
    }

    return {
      id: parsed.id,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

function compareNotebookItems(left: NotebookItem, right: NotebookItem) {
  const timestampComparison =
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()

  if (timestampComparison !== 0) {
    return timestampComparison
  }

  return right.noteId.localeCompare(left.noteId)
}

export function buildNotebookNotesPage(
  manualNotes: NotebookItem[],
  limit: number,
): NotebookNotesResponse {
  const sorted = [...manualNotes].sort(compareNotebookItems)
  const page = sorted.slice(0, limit)
  const hasMore = sorted.length > limit

  return {
    items: page,
    nextCursor: hasMore && page.length > 0 ? encodeNotebookCursor(page[page.length - 1]) : null,
    totalCount: page.length,
  }
}
