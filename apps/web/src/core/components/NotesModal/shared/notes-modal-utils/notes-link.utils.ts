export function normalizeNoteLinkUrl(rawUrl: string): string | null {
  const trimmedUrl = rawUrl.trim()

  if (!trimmedUrl) {
    return null
  }

  if (trimmedUrl.startsWith('#') || /^\/(?!\/)/.test(trimmedUrl)) {
    return trimmedUrl
  }

  if (/^\/\//.test(trimmedUrl)) {
    return `https:${trimmedUrl}`
  }

  if (/^(mailto:|tel:)/i.test(trimmedUrl)) {
    return trimmedUrl
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl
  }

  if (/^[^\s@]+\.[^\s@]{2,}(?:[/?#].*)?$/i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`
  }

  return null
}

export function escapeNoteLinkHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildNoteLinkHtml(url: string, text = url): string {
  const escapedUrl = escapeNoteLinkHtml(url)
  const escapedText = escapeNoteLinkHtml(text)

  return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`
}
