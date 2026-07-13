import { describe, expect, it } from 'vitest'
import {
  extractLookupIdentifiers,
  hasAnyIdentifier,
  stripLikeWildcards,
} from '../identifier-extraction'

describe('extractLookupIdentifiers', () => {
  it('extracts emails in lowercase', () => {
    const result = extractLookupIdentifiers([
      'Dame todo el detalle de Juan.Perez@Acme.COM por favor',
    ])

    expect(result.emails).toEqual(['juan.perez@acme.com'])
  })

  it('extracts user ids (UUID)', () => {
    const result = extractLookupIdentifiers([
      'Busca el usuario 6F5C0F1E-8AA6-4680-8AE8-792F2C3ECF08',
    ])

    expect(result.userIds).toEqual(['6f5c0f1e-8aa6-4680-8ae8-792f2c3ecf08'])
  })

  it('extracts quoted names', () => {
    const result = extractLookupIdentifiers([
      '¿Cuál es el progreso de "maria lopez"?',
    ])

    expect(result.names).toContain('maria lopez')
  })

  it('extracts capitalized full names from natural language', () => {
    const result = extractLookupIdentifiers([
      'dime el progreso de María López García en sus cursos',
    ])

    expect(result.names).toContain('María López García')
  })

  it('extracts the name from the reported message ("consulta global de Maria Domenzain")', () => {
    const result = extractLookupIdentifiers([
      'necesito una consulta global de Maria Domenzain',
    ])

    expect(result.names).toContain('Maria Domenzain')
  })

  it('extracts lowercase names introduced by a trigger phrase', () => {
    for (const message of [
      'dame el dossier de maria domenzain',
      'necesito información del usuario maria domenzain',
      'muéstrame el progreso de maria domenzain y su última conexión',
    ]) {
      const result = extractLookupIdentifiers([message])
      expect(result.names.some((name) => name.toLowerCase().includes('maria domenzain'))).toBe(
        true,
      )
    }
  })

  it('drops sentence-start stopwords before a name', () => {
    const result = extractLookupIdentifiers(['Hola Juan Pérez cuándo se conectó'])

    expect(result.names).toContain('Juan Pérez')
    expect(result.names.some((name) => name.startsWith('Hola'))).toBe(false)
  })

  it('scans previous messages so follow-up questions keep resolving the user', () => {
    const result = extractLookupIdentifiers([
      'dame el detalle de ana@empresa.com',
      '¿y su última conexión?',
    ])

    expect(result.emails).toEqual(['ana@empresa.com'])
  })

  it('returns empty identifiers for messages without user references', () => {
    const result = extractLookupIdentifiers(['hola, ¿qué puedes hacer?'])

    expect(hasAnyIdentifier(result)).toBe(false)
  })

  it('caps identifiers per type', () => {
    const emails = Array.from({ length: 6 }, (_, i) => `user${i}@test.com`).join(' ')
    const result = extractLookupIdentifiers([emails])

    expect(result.emails).toHaveLength(3)
  })
})

describe('stripLikeWildcards', () => {
  it('removes LIKE wildcards from user-provided identifiers', () => {
    expect(stripLikeWildcards('ju%an_ pe%rez')).toBe('ju an pe rez')
  })
})
