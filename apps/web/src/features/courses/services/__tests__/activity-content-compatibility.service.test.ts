import { describe, expect, it } from 'vitest'
import {
  isInteractiveLessonActivity,
  resolveActivityConfig,
} from '../activity-content-compatibility.service'

describe('activity-content-compatibility.service', () => {
  it('builds inline answer fields from legacy blanks', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent:
        'Para redactar un correo, uso _____.\nPara validar noticias, uso _____.',
    })

    expect(config?.interactionType).toBe('inline_answers')
    if (!config || config.interactionType !== 'inline_answers') {
      throw new Error('Expected inline answers config')
    }

    expect(config.submission.fields).toHaveLength(2)
    expect(config.submission.fields[0]?.id).toBe('blank_1')
  })

  it('builds checklist config from legacy checklist content', () => {
    const config = resolveActivityConfig({
      activityType: 'reflection',
      activityContent: '[ ] Analiza el prompt\n[x] Documenta tu respuesta',
    })

    expect(config?.interactionType).toBe('checklist')
    if (!config || config.interactionType !== 'checklist') {
      throw new Error('Expected checklist config')
    }

    expect(config.submission.checklistItems.map((item) => item.label)).toEqual([
      'Analiza el prompt',
      'Documenta tu respuesta',
    ])
  })

  it('merges tool detection and SofLIA validation into fallback config', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent: 'Copia este prompt en ChatGPT y pega aqui la evidencia.',
      aiPrompts: 'Analiza este caso paso a paso',
      requiresSofliaValidation: true,
    })

    expect(config?.toolTask?.toolKey).toBe('chatgpt')
    expect(config?.validation.enabled).toBe(true)
  })

  it('returns null for quiz and ai_chat because they preserve current flow', () => {
    expect(
      resolveActivityConfig({
        activityType: 'quiz',
        activityContent: '{"questions":[]}',
      }),
    ).toBeNull()
    expect(isInteractiveLessonActivity('quiz')).toBe(false)
    expect(isInteractiveLessonActivity('ai_chat')).toBe(false)
  })
})
