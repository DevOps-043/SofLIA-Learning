export function normalizeTextSegment(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
}

export function splitReadableTextSegments(value: string): string[] {
  const normalizedValue = value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .replace(/\s+(?=\[\d{2}:\d{2}\])/g, '\n\n')

  return normalizedValue
    .split(/\n{2,}/)
    .map(normalizeTextSegment)
    .filter(Boolean)
}
