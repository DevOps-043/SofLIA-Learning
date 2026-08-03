import { describe, expect, it } from 'vitest'
import {
  countMentionedContent,
  extractContentIdentifiers,
  findMentionedContent,
  mentionsContentVocabulary,
} from '../content-mention-matching'
import type { ContentCatalog } from '../types'

const CATALOG: ContentCatalog = {
  courses: [
    { id: 'c1', title: 'Fundamentos de IA Generativa', slug: 'fundamentos-ia-generativa' },
    { id: 'c2', title: 'Ética y Datos', slug: 'etica-y-datos' },
  ],
  learningPaths: [
    { id: 'p1', title: 'Ruta de Adopción de IA', slug: 'ruta-adopcion-ia' },
  ],
}

function mention(message: string) {
  return findMentionedContent(extractContentIdentifiers([message]), CATALOG)
}

describe('findMentionedContent', () => {
  it('detecta un curso por título, sin acentos ni mayúsculas', () => {
    const result = mention('como va etica y datos?')
    expect(result.courses.map((course) => course.title)).toEqual(['Ética y Datos'])
    expect(result.learningPaths).toEqual([])
  })

  it('detecta un curso por slug', () => {
    expect(mention('dame el detalle de fundamentos-ia-generativa').courses).toHaveLength(1)
  })

  it('detecta una ruta de aprendizaje', () => {
    const result = mention('qué cursos tiene la Ruta de Adopción de IA')
    expect(result.learningPaths.map((path) => path.title)).toEqual([
      'Ruta de Adopción de IA',
    ])
    expect(result.courses).toEqual([])
  })

  it('detecta por UUID explícito', () => {
    const catalog: ContentCatalog = {
      courses: [
        { id: '11111111-1111-4111-8111-111111111111', title: 'Curso X', slug: 'curso-x' },
      ],
      learningPaths: [],
    }
    const result = findMentionedContent(
      extractContentIdentifiers(['abre 11111111-1111-4111-8111-111111111111']),
      catalog,
    )
    expect(result.courses).toHaveLength(1)
  })

  it('no inventa contenido que no está en el catálogo', () => {
    const result = mention('cuéntame del curso de Blockchain Avanzado')
    expect(countMentionedContent(result)).toBe(0)
  })

  it('cuenta cursos y rutas juntos para decidir la desambiguación', () => {
    const result = mention('compara Ética y Datos con la Ruta de Adopción de IA')
    expect(countMentionedContent(result)).toBe(2)
  })
})

describe('mentionsContentVocabulary', () => {
  it('reconoce preguntas sobre el catálogo sin nombrar nada', () => {
    expect(mentionsContentVocabulary(['¿qué cursos hay disponibles?'])).toBe(true)
    expect(mentionsContentVocabulary(['dame el catálogo completo'])).toBe(true)
    expect(mentionsContentVocabulary(['¿cuántas lecciones tenemos?'])).toBe(true)
  })

  it('no se activa con preguntas ajenas al contenido', () => {
    expect(mentionsContentVocabulary(['¿cuántos usuarios activos hay?'])).toBe(false)
    expect(mentionsContentVocabulary([])).toBe(false)
  })
})
