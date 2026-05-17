export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value)
}

export function decodeCommonHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
}

export function stripHtml(value: string): string {
  return decodeCommonHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
}

export function hasMeaningfulStringContent(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (!looksLikeHtml(trimmed)) return true

  const textOnly = stripHtml(trimmed).replace(/\s+/g, ' ').trim()
  return Boolean(textOnly || /<(img|video|audio|iframe|embed|object|svg|table)\b/i.test(trimmed))
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
