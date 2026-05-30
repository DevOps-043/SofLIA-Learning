import { describe, expect, it } from 'vitest'

import {
  FIRST_CHUNK_CHARS,
  REST_CHUNK_CHARS,
  extractPlainText,
  hardSplitLongSentence,
  splitIntoSentenceChunks,
} from '../activity-voice-text'

describe('extractPlainText', () => {
  it('strips HTML and collapses whitespace', () => {
    expect(extractPlainText('<p>Hola <strong>mundo</strong></p>')).toBe('Hola mundo')
  })

  it('strips basic markdown', () => {
    expect(extractPlainText('# Titulo\n\nTexto **negrita**')).toContain('Titulo')
    expect(extractPlainText('Texto **negrita**')).toBe('Texto negrita')
  })

  it('returns empty string for blank content', () => {
    expect(extractPlainText('')).toBe('')
    expect(extractPlainText('   ')).toBe('')
  })
})

describe('splitIntoSentenceChunks', () => {
  const sentences = Array.from(
    { length: 10 },
    (_, i) => `Esta es la oracion numero ${i} con texto suficiente.`,
  )
  const text = sentences.join(' ')

  it('returns an empty array for empty text', () => {
    expect(splitIntoSentenceChunks('')).toEqual([])
  })

  it('keeps the first chunk small for a fast start', () => {
    const chunks = splitIntoSentenceChunks(text)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].length).toBeLessThanOrEqual(FIRST_CHUNK_CHARS)
  })

  it('keeps every chunk within the larger limit', () => {
    for (const chunk of splitIntoSentenceChunks(text)) {
      expect(chunk.length).toBeLessThanOrEqual(REST_CHUNK_CHARS)
    }
  })

  it('does not drop content', () => {
    const joined = splitIntoSentenceChunks(text).join(' ')
    for (const sentence of sentences) {
      expect(joined).toContain(sentence)
    }
  })
})

describe('hardSplitLongSentence', () => {
  it('splits a long comma-separated sentence and preserves the text', () => {
    const long = 'parte uno, parte dos, parte tres, parte cuatro'
    const out = hardSplitLongSentence(long, 20)

    expect(out.length).toBeGreaterThan(1)
    expect(out.join(' ')).toBe(long)
  })
})
