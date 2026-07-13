import { describe, expect, it } from 'vitest'
import { detectActionConfirmationIntent } from '../confirmation-intent'

describe('detectActionConfirmationIntent', () => {
  it('confirms only on explicit, unambiguous affirmations', () => {
    for (const message of [
      'confirmo',
      'Confirmo.',
      'sí',
      'Sí, confirmo',
      'ejecútala',
      'procede',
      'adelante',
      'hazlo',
    ]) {
      expect(detectActionConfirmationIntent(message)).toBe('confirm')
    }
  })

  it('cancels on explicit negations', () => {
    for (const message of ['no', 'cancela', 'mejor no', 'olvídalo', 'detente']) {
      expect(detectActionConfirmationIntent(message)).toBe('cancel')
    }
  })

  it('does NOT confirm hedged or conditional replies (fail-closed)', () => {
    for (const message of [
      'sí, pero cámbiale el motivo',
      '¿estás seguro?',
      'sí ¿pero eso qué hace?',
      'creo que sí',
      'tal vez',
      'ok pero antes explícame',
    ]) {
      expect(detectActionConfirmationIntent(message)).not.toBe('confirm')
    }
  })

  it('treats unrelated messages as unclear, never as confirmation', () => {
    expect(detectActionConfirmationIntent('¿cuántos usuarios hay?')).toBe('unclear')
    expect(detectActionConfirmationIntent('')).toBe('unclear')
  })
})
