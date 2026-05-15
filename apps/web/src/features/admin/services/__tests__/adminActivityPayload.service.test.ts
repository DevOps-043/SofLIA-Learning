import { describe, expect, it } from 'vitest'
import {
  validateCreateActivityPayload,
  validateUpdateActivityPayload,
} from '../adminActivityPayload.service'

describe('adminActivityPayload.service', () => {
  it('normalizes interactive activity payloads from activity_config', () => {
    const payload = validateCreateActivityPayload({
      activity_title: 'Valida la noticia',
      activity_description: 'Usa una fuente externa',
      activity_type: 'exercise',
      activity_content: 'Analiza la noticia y documenta tu verificacion.',
      activity_config: {
        interactionType: 'external_tool_task',
        submission: {
          responsePlaceholder: 'Pega tu veredicto',
          requireEvidence: true,
        },
        validation: {
          enabled: true,
          requiredForCompletion: true,
          rubric: [{ id: 'r1', label: 'Detecta sesgos' }],
        },
        toolTask: {
          toolKey: 'atlas',
          promptTemplate: 'Verifica la noticia con Atlas',
          openInNewTab: true,
          showCopyButton: true,
        },
      },
      estimated_time_minutes: 12,
    })

    expect(payload.external_tool_key).toBe('atlas')
    expect(payload.requires_soflia_validation).toBe(true)
    expect(payload.activity_schema_version).toBe(1)
    expect(payload.activity_config?.interactionType).toBe('external_tool_task')
  })

  it('drops activity_config for quiz payloads and keeps quiz flow intact', () => {
    const payload = validateCreateActivityPayload({
      activity_title: 'Quiz de cierre',
      activity_type: 'quiz',
      activity_content: '{"questions":[]}',
      activity_config: {
        interactionType: 'long_text',
        submission: {},
        validation: { enabled: false, requiredForCompletion: false, rubric: [] },
      },
    })

    expect(payload.activity_config).toBeNull()
    expect(payload.activity_type).toBe('quiz')
  })

  it('drops activity_config for reading payloads to keep a simple content flow', () => {
    const payload = validateCreateActivityPayload({
      activity_title: 'Lectura guiada',
      activity_type: 'reading',
      activity_content: 'Texto de lectura',
      activity_config: {
        interactionType: 'long_text',
        submission: {},
        validation: { enabled: true, requiredForCompletion: true, rubric: [] },
      },
    })

    expect(payload.activity_type).toBe('reading')
    expect(payload.activity_config).toBeNull()
  })

  it('preserves SofLIA dialogue config on ai_chat payloads for the new runtime', () => {
    const payload = validateCreateActivityPayload({
      activity_title: 'Dialogo con SofLIA',
      activity_type: 'ai_chat',
      activity_content: '{"introduction":"Caso"}',
      activity_config: {
        interactionType: 'soflia_dialogue',
        runtimeType: 'SOFLIA_DIALOGUE',
        visibleGoal: 'Justificar una decision.',
        scenario: 'Caso breve.',
        openingMessage: 'Que harias y por que?',
        successCriteria: [{ id: 'criterion_1', label: 'Explica causa' }],
        rescueContent: 'Una respuesta fuerte conecta causa y efecto.',
        rubric: [{ id: 'causality', label: 'Causalidad', weight: 100 }],
      },
    })

    expect(payload.activity_type).toBe('ai_chat')
    expect(payload.activity_schema_version).toBe(2)
    expect(payload.activity_config?.interactionType).toBe('soflia_dialogue')
    expect(payload.requires_soflia_validation).toBe(false)
  })

  it('rejects mismatched external tool keys', () => {
    expect(() =>
      validateUpdateActivityPayload({
        external_tool_key: 'gemini',
        activity_config: {
          interactionType: 'external_tool_task',
          submission: {},
          validation: { enabled: false, requiredForCompletion: false, rubric: [] },
          toolTask: {
            toolKey: 'chatgpt',
            promptTemplate: 'Haz el analisis',
            openInNewTab: true,
            showCopyButton: true,
          },
        },
      }),
    ).toThrow(/external_tool_key/i)
  })
})
