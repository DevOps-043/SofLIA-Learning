import { describe, expect, it } from 'vitest'

import {
  buildFormattedContent,
  canPregenerateReadingContent,
  isHtmlReadingContent,
  segmentReadingContent,
  toSpokenText,
} from '../reading-segmentation'

describe('isHtmlReadingContent', () => {
  it('detects HTML vs plain', () => {
    expect(isHtmlReadingContent('<p>Hola</p>')).toBe(true)
    expect(isHtmlReadingContent('Hola mundo')).toBe(false)
  })
})

describe('toSpokenText', () => {
  it('strips markdown markers', () => {
    expect(toSpokenText('**negrita** y `code`')).toBe('negrita y code')
    expect(toSpokenText('[link](https://x.com)')).toBe('link')
  })
})

describe('segmentReadingContent (plain)', () => {
  const raw = [
    'Introducción',
    'Este es el primer párrafo con suficiente texto para no ser título.',
    'Este es el segundo párrafo, también con bastante contenido para leer.',
    '- un punto de lista',
  ].join('\n')

  it('produces one segment per block, aligned with buildFormattedContent', () => {
    const blocks = buildFormattedContent(raw)
    const segments = segmentReadingContent(raw)

    expect(segments).toHaveLength(blocks.length)
    segments.forEach((segment, index) => {
      expect(segment.index).toBe(index)
      expect(segment.text.length).toBeGreaterThan(0)
    })
  })

  it('returns an empty array for blank content', () => {
    expect(segmentReadingContent('')).toEqual([])
    expect(segmentReadingContent('   ')).toEqual([])
  })
})

describe('canPregenerateReadingContent', () => {
  it('allows plain/markdown but not HTML (server-side, no DOM)', () => {
    expect(canPregenerateReadingContent('Texto plano')).toBe(true)
    expect(canPregenerateReadingContent('<p>HTML</p>')).toBe(false)
    expect(canPregenerateReadingContent('')).toBe(false)
  })

  it('does not segment HTML outside the browser', () => {
    // En entorno node (sin document) el HTML no se segmenta.
    expect(segmentReadingContent('<p>Hola</p>')).toEqual([])
  })
})
