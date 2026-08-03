import { describe, expect, it } from 'vitest'

import { buildImportedActivityRow } from '../course-import-activities'

const dialogueConfig = {
  interactionType: 'soflia_dialogue',
  runtimeType: 'SOFLIA_DIALOGUE',
  visibleGoal: 'Explicar una decision con evidencia.',
  scenario: 'Una situacion laboral requiere decidir con criterio.',
  openingMessage: 'Que decision tomarias y por que?',
  successCriteria: [{ id: 'criterio_1', label: 'Justifica la decision' }],
  rescueContent: 'Una respuesta fuerte conecta decision, evidencia e impacto.',
  rubric: [{ id: 'justificacion', label: 'Justificacion', weight: 100 }],
}

describe('course import activities', () => {
  it('preserves CourseEngine dialogue config on lia_script activities', () => {
    const row = buildImportedActivityRow({
      activity: {
        title: 'Conversacion guiada',
        type: 'lia_script',
        data: {
          introduction: 'Actividad conversacional',
          activity_config: dialogueConfig,
        },
      },
      index: 0,
      lessonId: 'lesson-1',
    })

    expect(row.activity_type).toBe('ai_chat')
    expect(row.activity_schema_version).toBe(2)
    expect(row.activity_config?.interactionType).toBe('soflia_dialogue')
    expect(row.requires_soflia_validation).toBe(false)
  })

  it('promotes legacy lia_script activities to the central dialogue runtime', () => {
    const row = buildImportedActivityRow({
      activity: {
        title: 'Guion legacy',
        type: 'lia_script',
        data: {
          introduction: 'Reflexiona sobre el caso.',
          scenes: [
            { character: 'SofLIA', message: 'Hola. ¿Qué harías en este caso?' },
          ],
          conclusion: 'Una buena respuesta explica la decisión y su impacto.',
        },
      },
      index: 1,
      lessonId: 'lesson-1',
    })

    expect(row.activity_type).toBe('ai_chat')
    expect(row.activity_schema_version).toBe(2)
    expect(row.activity_config?.interactionType).toBe('soflia_dialogue')
  })
})
