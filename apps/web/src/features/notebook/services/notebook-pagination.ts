const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

export function normalizeNotebookPageSize(value?: number | null): number {
  if (!Number.isFinite(value)) return DEFAULT_PAGE_SIZE
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(value || 0)))
}

export function encodeNotebookCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url')
}

export function decodeNotebookCursor(cursor?: string | null): number {
  if (!cursor) return 0
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { offset?: unknown }
    return typeof parsed.offset === 'number' &&
      Number.isInteger(parsed.offset) &&
      parsed.offset >= 0 &&
      parsed.offset <= 1_000_000
      ? parsed.offset
      : 0
  } catch {
    return 0
  }
}

