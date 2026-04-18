import { GoogleGenerativeAI } from '@google/generative-ai'

import {
  activityEvaluationFeedbackSchema,
  type ActivityConfig,
  type ActivityEvaluationFeedback,
} from '../types/activity-config'
import {
  CourseActivityError,
  type CourseActivityContext,
  type CourseLessonContext,
} from './activity-submission.server.service'
import {
  getActivitySubmissionRequirementIssues,
  summarizeActivitySubmissionRequirementIssues,
} from './activity-submission-requirements.service'

type SubmissionForValidation = {
  evidencePayload: Record<string, unknown> | null
  responsePayload: Record<string, unknown>
  responseText: string | null
}

function stringifyPretty(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function buildRubricText(activityConfig: ActivityConfig) {
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

function buildValidationPrompt(input: {
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

function parseGeminiJsonResponse(rawResponse: string): ActivityEvaluationFeedback {
  const trimmedResponse = rawResponse.trim()
  const cleanedResponse = trimmedResponse.replace(/^```json\s*|\s*```$/g, '')
  const parsedJson = JSON.parse(cleanedResponse)
  return activityEvaluationFeedbackSchema.parse(parsedJson)
}

export async function evaluateActivitySubmissionWithSoflia(input: {
  context: CourseActivityContext
  submission: SubmissionForValidation
}) {
  const { context, submission } = input

  if (!context.resolvedActivityConfig?.validation.enabled) {
    throw new CourseActivityError(
      'VALIDATION_NOT_ENABLED',
      400,
      'La actividad no tiene validacion SofLIA habilitada',
    )
  }

  const requirementIssues = getActivitySubmissionRequirementIssues(
    context.resolvedActivityConfig,
    submission,
  )

  if (requirementIssues.length > 0) {
    throw new CourseActivityError(
      'INVALID_SUBMISSION',
      400,
      summarizeActivitySubmissionRequirementIssues(requirementIssues),
      {
        issues: requirementIssues.map((issue) => issue.code),
      },
    )
  }

  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) {
    throw new CourseActivityError(
      'VALIDATION_UNAVAILABLE',
      503,
      'La validacion SofLIA no esta disponible en este entorno',
    )
  }

  const genAI = new GoogleGenerativeAI(googleApiKey)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 1200,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })

  try {
    const result = await model.generateContent(
      buildValidationPrompt({
        context,
        submission,
      }),
    )

    const feedback = parseGeminiJsonResponse(result.response.text())
    return {
      feedback,
      modelName,
    }
  } catch (error) {
    throw new CourseActivityError(
      'VALIDATION_FAILED',
      502,
      'No fue posible validar la actividad con SofLIA',
      {
        message: error instanceof Error ? error.message : String(error),
      },
    )
  }
}

export function buildTrackingEvaluationSnapshot(input: {
  context: CourseLessonContext
  submissionId: string
  feedback: ActivityEvaluationFeedback
}) {
  return {
    context: {
      courseId: input.context.courseId,
      enrollmentId: input.context.enrollmentId,
      lessonId: input.context.lessonId,
      organizationId: input.context.organizationId,
      userId: input.context.userId,
    },
    feedback: input.feedback,
    submissionId: input.submissionId,
  }
}
