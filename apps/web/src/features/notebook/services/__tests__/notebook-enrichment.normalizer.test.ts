import { describe, expect, it } from 'vitest'

import { buildEnrichmentPromptForGoogle } from '../notebook-enrichment.google.prompt'

import {
  clip,
  computeNoteContentHash,
  normalizeAiOutput,
  stripHtmlToText,
} from '../notebook-enrichment.normalizer'

describe('computeNoteContentHash', () => {
  it('is stable for the same title + content', () => {
    expect(computeNoteContentHash('Título', '<p>Hola</p>')).toBe(
      computeNoteContentHash('Título', '<p>Hola</p>'),
    )
  })

  it('ignores leading/trailing whitespace', () => {
    expect(computeNoteContentHash(' Título ', ' <p>Hola</p> ')).toBe(
      computeNoteContentHash('Título', '<p>Hola</p>'),
    )
  })

  it('changes when the content changes', () => {
    expect(computeNoteContentHash('Título', '<p>Hola</p>')).not.toBe(
      computeNoteContentHash('Título', '<p>Adiós</p>'),
    )
  })

  it('distinguishes title/content boundaries', () => {
    expect(computeNoteContentHash('ab', 'c')).not.toBe(
      computeNoteContentHash('a', 'bc'),
    )
  })
})

describe('stripHtmlToText', () => {
  it('removes tags and decodes basic entities', () => {
    expect(stripHtmlToText('<p>Hola &amp; <strong>mundo</strong>&nbsp;!</p>')).toBe(
      'Hola & mundo !',
    )
  })

  it('collapses whitespace', () => {
    expect(stripHtmlToText('<p>a</p>\n\n<p>b</p>')).toBe('a b')
  })
})

describe('normalizeAiOutput', () => {
  it('normalizes a complete valid output', () => {
    const result = normalizeAiOutput({
      summary: 'Resumen del apunte.',
      knowledge_type: 'decision',
      key_concepts: ['RAG', 'Embeddings'],
      suggested_tags: ['ia', 'notas'],
      detected_tasks: [{ title: 'Revisar la documentación' }],
      confidence: 0.87,
    })

    expect(result).toEqual({
      confidence: 0.87,
      detectedTasks: ['Revisar la documentación'],
      keyConcepts: ['RAG', 'Embeddings'],
      knowledgeType: 'decision',
      suggestedTags: ['ia', 'notas'],
      summary: 'Resumen del apunte.',
    })
  })

  it('falls back to safe defaults on garbage input', () => {
    const result = normalizeAiOutput('not-an-object')

    expect(result).toEqual({
      confidence: null,
      detectedTasks: [],
      keyConcepts: [],
      knowledgeType: 'note',
      suggestedTags: [],
      summary: null,
    })
  })

  it('rejects unknown knowledge types', () => {
    expect(normalizeAiOutput({ knowledge_type: 'hacker' }).knowledgeType).toBe('note')
  })

  it('clamps confidence into [0, 1]', () => {
    expect(normalizeAiOutput({ confidence: 3.5 }).confidence).toBe(1)
    expect(normalizeAiOutput({ confidence: -1 }).confidence).toBe(0)
    expect(normalizeAiOutput({ confidence: Number.NaN }).confidence).toBeNull()
  })

  it('dedupes case-insensitively and caps list sizes', () => {
    const result = normalizeAiOutput({
      key_concepts: ['RAG', 'rag', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      detected_tasks: Array.from({ length: 10 }, (_, i) => ({ title: `Tarea ${i}` })),
    })

    expect(result.keyConcepts).toHaveLength(8)
    expect(result.keyConcepts.filter((c) => c.toLowerCase() === 'rag')).toHaveLength(1)
    expect(result.detectedTasks).toHaveLength(5)
  })

  it('clips oversized summaries', () => {
    const summary = 'x'.repeat(5_000)
    const normalized = normalizeAiOutput({ summary })
    expect(normalized.summary).not.toBeNull()
    expect((normalized.summary as string).length).toBeLessThanOrEqual(1_503)
  })
})

describe('clip', () => {
  it('returns short values untouched', () => {
    expect(clip('hola', 10)).toBe('hola')
  })

  it('truncates long values with ellipsis', () => {
    expect(clip('abcdefghij', 5)).toBe('abcde...')
  })
})

describe('buildEnrichmentPrompt', () => {
  it('frames the note content as data inside <apunte> markers', () => {
    const prompt = buildEnrichmentPromptForGoogle({
      existingTags: ['ia'],
      noteText: 'Contenido del apunte',
      noteTitle: 'Mi título',
    })

    expect(prompt).toContain('<apunte>')
    expect(prompt).toContain('</apunte>')
    expect(prompt).toContain('Contenido del apunte')
    expect(prompt).toContain('Mi título')
    expect(prompt).toContain('nunca instrucciones')
  })
})
