import { describe, expect, it } from 'vitest'

import { dialogueActivityConfigSchema } from '../dialogue-runtime'
import { normalizeActivityConfig } from '../activity-config'

describe('dialogue runtime schema', () => {
  it('accepts a valid SofLIA dialogue config', () => {
    const parsed = normalizeActivityConfig({
      interactionType: 'soflia_dialogue',
      runtimeType: 'SOFLIA_DIALOGUE',
      visibleGoal: 'Justificar una decision.',
      scenario: 'Caso breve.',
      openingMessage: 'Que harias y por que?',
      successCriteria: [{ id: 'criterion_1', label: 'Explica causa' }],
      rescueContent: 'Una respuesta fuerte conecta causa y efecto.',
      rubric: [{ id: 'causality', label: 'Causalidad', weight: 50 }],
    })

    expect(parsed?.interactionType).toBe('soflia_dialogue')
    expect(parsed?.contextAdaptation.enabled).toBe(true)
  })

  it('accepts optional organization context adaptation guidance', () => {
    const parsed = normalizeActivityConfig({
      interactionType: 'soflia_dialogue',
      runtimeType: 'SOFLIA_DIALOGUE',
      visibleGoal: 'Adaptar una decision al contexto empresarial.',
      scenario: 'Caso breve.',
      openingMessage: 'Que harias y por que?',
      contextAdaptation: {
        enabled: true,
        focus: ['industry', 'scale', 'role'],
        instructions: 'Prioriza ejemplos realistas para marketing.',
      },
      successCriteria: [{ id: 'criterion_1', label: 'Explica causa' }],
      rescueContent: 'Una respuesta fuerte conecta causa y efecto.',
      rubric: [{ id: 'causality', label: 'Causalidad', weight: 50 }],
    })

    expect(parsed?.interactionType).toBe('soflia_dialogue')
    expect(parsed?.contextAdaptation.focus).toEqual([
      'industry',
      'scale',
      'role',
    ])
  })

  it('rejects dialogue configs without observable criteria', () => {
    const parsed = dialogueActivityConfigSchema.safeParse({
      interactionType: 'soflia_dialogue',
      runtimeType: 'SOFLIA_DIALOGUE',
      visibleGoal: 'Justificar una decision.',
      scenario: 'Caso breve.',
      openingMessage: 'Que harias y por que?',
      successCriteria: [],
      rescueContent: 'Modelo correcto.',
      rubric: [{ id: 'causality', label: 'Causalidad', weight: 50 }],
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects context adaptation instructions that are too long', () => {
    const parsed = dialogueActivityConfigSchema.safeParse({
      interactionType: 'soflia_dialogue',
      runtimeType: 'SOFLIA_DIALOGUE',
      visibleGoal: 'Justificar una decision.',
      scenario: 'Caso breve.',
      openingMessage: 'Que harias y por que?',
      contextAdaptation: {
        instructions: 'a'.repeat(1001),
      },
      successCriteria: [{ id: 'criterion_1', label: 'Explica causa' }],
      rescueContent: 'Modelo correcto.',
      rubric: [{ id: 'causality', label: 'Causalidad', weight: 50 }],
    })

    expect(parsed.success).toBe(false)
  })
})
