export function stringifySampleContent(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  try {
    return JSON.stringify(value).slice(0, 1200)
  } catch {
    return String(value)
  }
}
