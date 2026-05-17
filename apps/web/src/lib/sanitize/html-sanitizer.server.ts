export function basicServerSanitize(
  html: string,
  allowedTags: string[],
): string {
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')

  if (!allowedTags.length) {
    return sanitized.replace(/<[^>]*>/g, '')
  }

  const allowedTagsSet = new Set(allowedTags.map((tag) => tag.toLowerCase()))
  sanitized = sanitized.replace(
    /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi,
    (_match, closing, tagName) => {
      const lowerTag = tagName.toLowerCase()
      return allowedTagsSet.has(lowerTag) ? `<${closing}${lowerTag}>` : ''
    },
  )

  return sanitized
}
