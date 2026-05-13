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
})
