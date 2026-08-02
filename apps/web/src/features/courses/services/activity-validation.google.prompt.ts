import type { ActivityConfig } from '../types/activity-config'
import type { CourseActivityContext } from './activity-submission.server.service'

/**
 * VARIANTE GEMINI del prompt de validacion de actividad. TEXTO ORIGINAL, CONGELADO.
 *
 * No se toca para mejorar OpenAI: para eso existe
 * `activity-validation.openai.prompt.ts`.
 */

export type SubmissionForValidation = {
  evidencePayload: Record<string, unknown> | null
  responsePayload: Record<string, unknown>
  responseText: string | null
}

function stringifyPretty(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

/**
 * Rubrica en texto. Es CONTENIDO compartido por las dos variantes: describe la
 * actividad, no la forma de hablarle al modelo.
 */
export function buildRubricText(activityConfig: ActivityConfig) {
  if (activityConfig.interactionType === 'soflia_dialogue') {
    return activityConfig.rubric
      .map((item) =>
        item.description ? `- ${item.label}: ${item.description}` : `- ${item.label}`,
      )
      .join('\n')
  }

  if (!activityConfig.validation.rubric.length) {
    return '- Evalua si la respuesta cumple con la consigna y es util para el usuario.'
  }

  return activityConfig.validation.rubric
    .map((item) => {
      if (!item.description) {
        return `- ${item.label}`
      }

      return `- ${item.label}: ${item.description}`
    })
    .join('\n')
}

export function buildValidationPromptForGoogle(input: {
  context: CourseActivityContext
  submission: SubmissionForValidation
}) {
  const { context, submission } = input
  const rubricText = buildRubricText(context.resolvedActivityConfig!)

  return `
Eres SofLIA evaluando una actividad de aprendizaje.

Debes responder SOLO un JSON valido con esta estructura exacta:
{
  "resultStatus": "pass" | "revise" | "error",
  "summary": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "suggestedNextStep": "string"
}

Reglas:
- Usa "pass" si la respuesta cumple razonablemente la actividad.
- Usa "revise" si hay errores relevantes, vacios importantes o falta evidencia necesaria.
- Usa "error" solo si la entrada esta vacia, es ininterpretable o no se puede evaluar.
- La retroalimentacion debe ser breve, concreta y formativa.
- No reescribas toda la respuesta del usuario.
- No agregues markdown, texto extra ni bloques de codigo.

Actividad:
- Titulo: ${String(context.activity.activity_title || context.activity.activity_id)}
- Tipo: ${String(context.activity.activity_type || 'activity')}
- Descripcion: ${String(context.activity.activity_description || '')}
- Configuracion interactiva: ${stringifyPretty(context.resolvedActivityConfig)}
- Contenido/instrucciones: ${String(context.activity.activity_content || '')}

Rubrica:
${rubricText}

Respuesta del usuario:
- responseText: ${submission.responseText || ''}
- responsePayload: ${stringifyPretty(submission.responsePayload)}
- evidencePayload: ${stringifyPretty(submission.evidencePayload)}
`.trim()
}
