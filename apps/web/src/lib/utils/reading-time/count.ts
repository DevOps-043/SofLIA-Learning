export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  const cleanedText = text
    .trim()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')

  if (cleanedText.length === 0) {
    return 0
  }

  return cleanedText.split(' ').filter((word) => word.length > 0).length
}
