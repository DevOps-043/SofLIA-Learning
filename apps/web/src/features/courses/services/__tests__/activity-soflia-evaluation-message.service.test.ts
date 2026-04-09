import { describe, expect, it } from 'vitest'

import {
  buildActivitySofliaEvaluationMessage,
  hasActivityResponseForSofliaEvaluation,
} from '../activity-soflia-evaluation-message.service'

describe('activity-soflia-evaluation-message.service', () => {
  it('builds a readable evaluation message for inline answers', () => {
    const message = buildActivitySofliaEvaluationMessage({
      activity: {
        activity_title: 'Clasificacion de tareas',
        activity_description: 'Selecciona la herramienta correcta.',
        activity_type: 'exercise',
        activity_content:
          'Para redactar un correo persuasivo, uso _____.\nPara validar noticias, uso _____.',
        activity_config: {
          interactionType: 'inline_answers',
          submission: {
            fields: [
              { id: 'blank_1', label: 'Correo persuasivo', required: true },
              { id: 'blank_2', label: 'Validar noticias', required: true },
            ],
            requireEvidence: false,
          },
          validation: {
            enabled: true,
            requiredForCompletion: false,
            rubric: [{ id: 'accuracy', label: 'Precision de la herramienta' }],
          },
        },
        is_required: true,
      },
      request: {
        responseText: null,
        responsePayload: {
          answers: {
            blank_1: 'ChatGPT',
            blank_2: 'Atlas',
          },
        },
        evidencePayload: {
          text: 'Use la regla creatividad vs veracidad.',
        },
      },
    })

    expect(message).toContain('[SYSTEM_EVENT: ACTIVITY_EVALUATION_REQUEST]')
    expect(message).toContain('Actividad: "Clasificacion de tareas"')
    expect(message).toContain('- Correo persuasivo: ChatGPT')
    expect(message).toContain('- Validar noticias: Atlas')
    expect(message).toContain('Criterios de revision:')
    expect(message).toContain('Evidencia adicional del usuario:')
  })

  it('detects checklist progress as evaluable content', () => {
    const hasContent = hasActivityResponseForSofliaEvaluation({
      activity: {
        activity_title: 'Checklist ejecutivo',
        activity_type: 'exercise',
        activity_content: '[ ] Revisa el prompt',
        activity_config: {
          interactionType: 'checklist',
          submission: {
            checklistItems: [
              { id: 'item_1', label: 'Revisar el prompt', required: true },
            ],
            requireEvidence: false,
          },
          validation: {
            enabled: true,
            requiredForCompletion: false,
            rubric: [],
          },
        },
        is_required: false,
      },
      request: {
        responseText: '',
        responsePayload: {
          checklist: {
            item_1: true,
          },
        },
        evidencePayload: null,
      },
    })

    expect(hasContent).toBe(true)
  })

  it('returns null when the activity has no response to evaluate', () => {
    const message = buildActivitySofliaEvaluationMessage({
      activity: {
        activity_title: 'Reflexion final',
        activity_type: 'reflection',
        activity_content: 'Escribe tu conclusion.',
        activity_config: {
          interactionType: 'long_text',
          submission: {
            requireEvidence: false,
          },
          validation: {
            enabled: true,
            requiredForCompletion: false,
            rubric: [],
          },
        },
        is_required: false,
      },
      request: {
        responseText: '   ',
        responsePayload: {},
        evidencePayload: null,
      },
    })

    expect(message).toBeNull()
  })
})
