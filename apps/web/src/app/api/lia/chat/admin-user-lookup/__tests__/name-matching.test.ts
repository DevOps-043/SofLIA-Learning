import { describe, expect, it } from 'vitest'
import {
  buildAccentTolerantPattern,
  matchesSearchedName,
  normalizeNameForMatch,
} from '../name-matching'

describe('normalizeNameForMatch', () => {
  it('strips diacritics, lowercases and collapses spaces', () => {
    expect(normalizeNameForMatch('María  Domenzáin')).toBe('maria domenzain')
    expect(normalizeNameForMatch('JOÃO Gonçalves')).toBe('joao goncalves')
  })
})

describe('buildAccentTolerantPattern', () => {
  it('replaces accent-prone letters with the single-char LIKE wildcard', () => {
    // "Maria" -> las vocales pueden llevar tilde en la BD ("María"),
    // así que se sustituyen por `_` para que el SQL las traiga igual.
    expect(buildAccentTolerantPattern('Maria')).toBe('%M_r__%'.toLowerCase())
  })

  it('returns null for empty terms', () => {
    expect(buildAccentTolerantPattern('   ')).toBeNull()
  })
})

describe('matchesSearchedName', () => {
  it('matches the reported bug: "Maria Domenzain" vs "María Domenzain"', () => {
    expect(matchesSearchedName('Maria Domenzain', 'María Domenzain')).toBe(true)
  })

  it('matches regardless of accents, case and word order', () => {
    expect(matchesSearchedName('maria domenzain', 'María Domenzain')).toBe(true)
    expect(matchesSearchedName('Domenzain Maria', 'María Domenzain')).toBe(true)
    expect(matchesSearchedName('MARÍA', 'María Domenzain')).toBe(true)
  })

  it('matches a partial name (first name only)', () => {
    expect(matchesSearchedName('Maria', 'María Domenzain')).toBe(true)
  })

  it('rejects candidates that do not contain every searched word', () => {
    expect(matchesSearchedName('Maria Domenzain', 'María López')).toBe(false)
    expect(matchesSearchedName('Maria Domenzain', 'Carlos Domenzain')).toBe(false)
  })

  it('rejects empty or missing candidate names', () => {
    expect(matchesSearchedName('Maria', null)).toBe(false)
    expect(matchesSearchedName('Maria', '')).toBe(false)
    expect(matchesSearchedName('', 'María Domenzain')).toBe(false)
  })
})
