const DANGEROUS_HTML_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<embed/i,
  /<object/i,
]

export function containsDangerousHtml(input: string): boolean {
  return DANGEROUS_HTML_PATTERNS.some((pattern) => pattern.test(input))
}

export function getSanitizationStats(original: string, sanitized: string) {
  return {
    originalLength: original.length,
    sanitizedLength: sanitized.length,
    removedChars: original.length - sanitized.length,
    containedDangerousHtml: containsDangerousHtml(original),
    wasSanitized: original !== sanitized,
  }
}
