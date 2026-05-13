import { describe, expect, it } from 'vitest'
import {
  isInteractiveLessonActivity,
  resolveActivityConfig,
  resolveActivityConfigFromRecord,
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

  it('builds checklist config from legacy exercise checklist content', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
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

  it('keeps reflection activities read-only when they have no explicit config', () => {
    const config = resolveActivityConfig({
      activityType: 'reflection',
      activityContent: '[ ] Analiza el prompt\n[x] Documenta tu respuesta',
    })

    expect(config).toBeNull()
    expect(isInteractiveLessonActivity('reflection')).toBe(false)
  })

  it('keeps explicitly configured reflection activities read-only', () => {
    const config = resolveActivityConfig({
      activityType: 'reflection',
      activityContent: 'Escribe una conclusion breve.',
      rawActivityConfig: {
        interactionType: 'long_text',
        submission: {
          responsePlaceholder: 'Escribe tu conclusion.',
        },
        validation: {
          enabled: false,
          requiredForCompletion: false,
          rubric: [],
        },
      },
    })

    expect(config).toBeNull()
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

  it('keeps explicit SofLIA dialogue config even on legacy ai_chat activities', () => {
    const config = resolveActivityConfig({
      activityType: 'ai_chat',
      activityContent: '{"scenes":[]}',
      rawActivityConfig: {
        interactionType: 'soflia_dialogue',
        runtimeType: 'SOFLIA_DIALOGUE',
        visibleGoal: 'Practicar comunicacion asertiva.',
        scenario: 'Explica una situacion laboral con tension comunicativa.',
        openingMessage: 'Describe brevemente la situacion.',
        successCriteria: [
          {
            id: 'impacto',
            label: 'Explica impacto',
            required: true,
          },
        ],
        rescueContent: 'Una respuesta fuerte conecta conducta, impacto y alternativa.',
        rubric: [
          {
            id: 'claridad',
            label: 'Claridad',
            weight: 100,
          },
        ],
      },
    })

    expect(config?.interactionType).toBe('soflia_dialogue')
  })

  it('does not infer external tool actions from plain mentions in the question text', () => {
    const config = resolveActivityConfig({
      activityType: 'exercise',
      activityContent:
        'Completa cada frase escribiendo la herramienta correcta ChatGPT, Atlas u otra.',
    })

    expect(config?.toolTask).toBeUndefined()
  })

  it('maps snake_case activity records from Supabase correctly', () => {
    const config = resolveActivityConfigFromRecord({
      activity_type: 'exercise',
      activity_content: 'Para redactar un correo, uso _____.',
      ai_prompts: 'Usa ChatGPT',
      requires_soflia_validation: true,
      external_tool_key: 'chatgpt',
    })

    expect(config?.interactionType).toBe('inline_answers')
    expect(config?.validation.enabled).toBe(true)
    expect(config?.toolTask?.toolKey).toBe('chatgpt')
  })
})
