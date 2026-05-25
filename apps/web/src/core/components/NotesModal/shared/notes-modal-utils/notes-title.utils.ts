export function buildNotePdfFileName(
  title: string,
  date = new Date(),
  suffix = 'pdf',
): string {
  const sanitizedTitle = (title || 'nota')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
  const datePart = date.toISOString().split('T')[0]

  return `${sanitizedTitle || 'nota'}_${datePart}.${suffix}`
}
