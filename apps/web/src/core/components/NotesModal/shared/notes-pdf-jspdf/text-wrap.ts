import type { WrapPdfTextParams } from './types'

function splitOversizedToken(
  token: string,
  maxWidth: number,
  measureText: (value: string) => number,
): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  Array.from(token).forEach((character) => {
    const candidate = `${currentChunk}${character}`
    if (currentChunk && measureText(candidate) > maxWidth) {
      chunks.push(currentChunk)
      currentChunk = character
      return
    }
    currentChunk = candidate
  })

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

export function wrapPdfText({ maxWidth, measureText, text }: WrapPdfTextParams): string[] {
  const normalizedText = text.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
  if (!normalizedText) return []

  return normalizedText.split(/\r?\n/).flatMap((rawParagraph) => {
    const paragraph = rawParagraph.trim()
    if (!paragraph) return ['']

    const lines: string[] = []
    let currentLine = ''
    paragraph.split(/\s+/).forEach((word) => {
      const wordParts = measureText(word) > maxWidth
        ? splitOversizedToken(word, maxWidth, measureText)
        : [word]

      wordParts.forEach((wordPart) => {
        const candidate = currentLine ? `${currentLine} ${wordPart}` : wordPart
        if (currentLine && measureText(candidate) > maxWidth) {
          lines.push(currentLine)
          currentLine = wordPart
          return
        }
        currentLine = candidate
      })
    })

    if (currentLine) lines.push(currentLine)
    return lines
  })
}
