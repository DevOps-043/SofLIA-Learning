import { describe, expect, it } from 'vitest'

import {
  buildPlainTranscript,
  formatSegmentsForPrompt,
  formatTimecode,
  parseTranscriptSegments,
} from '../transcript-segments'

describe('parseTranscriptSegments', () => {
  it('acepta segmentos válidos y los ordena por tiempo', () => {
    const segments = parseTranscriptSegments([
      { start: 30, end: 45, text: 'segundo' },
      { start: 0, end: 12, text: 'primero' },
    ])

    expect(segments.map((segment) => segment.text)).toEqual(['primero', 'segundo'])
  })

  it('descarta segmentos con tiempo inválido en lugar de mostrarlos como reales', () => {
    const segments = parseTranscriptSegments([
      { start: 'no-es-un-numero', text: 'malo' },
      { start: -5, text: 'negativo' },
      { start: Number.NaN, text: 'nan' },
      { start: 10, text: 'bueno' },
    ])

    expect(segments).toHaveLength(1)
    expect(segments[0].text).toBe('bueno')
  })

  it('descarta segmentos sin texto', () => {
    expect(parseTranscriptSegments([{ start: 0, text: '   ' }])).toHaveLength(0)
  })

  it('iguala end a start cuando falta o es incoherente, sin perder el texto', () => {
    const segments = parseTranscriptSegments([
      { start: 20, end: 5, text: 'end anterior al start' },
      { start: 40, text: 'sin end' },
    ])

    expect(segments[0].end).toBe(20)
    expect(segments[1].end).toBe(40)
  })

  it('tolera valores que no son arrays', () => {
    expect(parseTranscriptSegments(null)).toEqual([])
    expect(parseTranscriptSegments('texto')).toEqual([])
    expect(parseTranscriptSegments(undefined)).toEqual([])
  })
})

describe('formatTimecode', () => {
  it('formatea mm:ss y h:mm:ss', () => {
    expect(formatTimecode(0)).toBe('0:00')
    expect(formatTimecode(65)).toBe('1:05')
    expect(formatTimecode(192)).toBe('3:12')
    expect(formatTimecode(3_725)).toBe('1:02:05')
  })

  it('no produce tiempos negativos', () => {
    expect(formatTimecode(-30)).toBe('0:00')
  })
})

describe('formatSegmentsForPrompt', () => {
  it('antepone la marca de tiempo a cada línea', () => {
    const output = formatSegmentsForPrompt(
      [{ start: 192, end: 200, text: 'aqui se explica el concepto' }],
      1_000,
    )

    expect(output).toBe('[3:12] aqui se explica el concepto')
  })

  it('trunca avisando cuando se supera el presupuesto', () => {
    const output = formatSegmentsForPrompt(
      [
        { start: 0, end: 5, text: 'a'.repeat(50) },
        { start: 5, end: 10, text: 'b'.repeat(50) },
      ],
      60,
    )

    expect(output).toContain('truncada por longitud')
    expect(output).not.toContain('b'.repeat(50))
  })

  it('devuelve cadena vacía sin segmentos', () => {
    expect(formatSegmentsForPrompt([], 100)).toBe('')
  })
})

describe('buildPlainTranscript', () => {
  it('une los segmentos como texto corrido sin marcas', () => {
    const text = buildPlainTranscript([
      { start: 0, end: 5, text: 'uno' },
      { start: 5, end: 10, text: 'dos' },
    ])

    expect(text).toBe('uno\n\ndos')
    expect(text).not.toContain('[')
  })
})
