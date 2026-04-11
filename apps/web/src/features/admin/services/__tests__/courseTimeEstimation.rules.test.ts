import { describe, expect, it } from 'vitest'
import { analyzeTimeEstimationTarget } from '../courseTimeEstimation.rules'
import type { CourseTimeEstimationTarget } from '../courseTimeEstimation.types'

function makeTarget(
  overrides: Partial<CourseTimeEstimationTarget> = {},
): CourseTimeEstimationTarget {
  return {
    id: 'target-1',
    kind: 'material',
    targetType: 'quiz',
    lessonId: 'lesson-1',
    lessonTitle: 'Leccion de prueba',
    moduleId: 'module-1',
    moduleTitle: 'Modulo 1',
    title: 'Quiz de prueba',
    description: 'Descripcion',
    content: null,
    estimatedTimeMinutes: null,
    ...overrides,
  }
}

describe('courseTimeEstimation.rules', () => {
  it('estimates a 4-question quiz at 6 minutes', () => {
    const result = analyzeTimeEstimationTarget(
      makeTarget({
        content: {
          questions: [
            { question: 'Pregunta 1' },
            { question: 'Pregunta 2' },
            { question: 'Pregunta 3' },
            { question: 'Pregunta 4' },
          ],
        },
      }),
    )

    expect(result.deterministicMinutes).toBe(6)
    expect(result.confidence).toBe('high')
    expect(result.signals.questionCount).toBe(4)
  })

  it('uses reading-time heuristics for reading materials', () => {
    const content = Array.from({ length: 360 }, () => 'palabra').join(' ')

    const result = analyzeTimeEstimationTarget(
      makeTarget({
        targetType: 'reading',
        title: 'Lectura',
        description: null,
        content,
      }),
    )

    expect(result.deterministicMinutes).toBe(2)
    expect(result.confidence).toBe('high')
    expect(result.signals.wordCount).toBe(361)
  })

  it('keeps ai_chat activities short and bounded', () => {
    const result = analyzeTimeEstimationTarget(
      makeTarget({
        kind: 'activity',
        targetType: 'ai_chat',
        title: 'Conversa con SofLIA',
        aiPrompts: JSON.stringify(['Primer prompt', 'Segundo prompt']),
        content: JSON.stringify({
          instructions:
            'Habla con SofLIA sobre un caso comercial y responde de forma breve.',
        }),
      }),
    )

    expect(result.deterministicMinutes).toBeGreaterThanOrEqual(3)
    expect(result.deterministicMinutes).toBeLessThanOrEqual(8)
    expect(result.deterministicMinutes).toBe(5)
    expect(result.rationale).toMatch(/SofLIA/i)
  })

  it('adds time when a reflection requires evidence', () => {
    const result = analyzeTimeEstimationTarget(
      makeTarget({
        kind: 'activity',
        targetType: 'reflection',
        title: 'Reflexion guiada',
        content:
          'Describe como aplicaras esta tecnica en tu siguiente visita comercial.',
        requiresSofliaValidation: true,
      }),
    )

    expect(result.deterministicMinutes).toBe(4)
    expect(result.signals.requireEvidence).toBe(true)
  })
})
