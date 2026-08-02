import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import {
  activityEvaluationFeedbackSchema,
  type ActivityEvaluationFeedback,
} from '../types/activity-config'
import {
  buildValidationPromptForGoogle,
  type SubmissionForValidation,
} from './activity-validation.google.prompt'
import { buildValidationPromptForOpenAi } from './activity-validation.openai.prompt'
import {
  CourseActivityError,
  type CourseActivityContext,
  type CourseLessonContext,
} from './activity-submission.server.service'
import {
  getActivitySubmissionRequirementIssues,
  summarizeActivitySubmissionRequirementIssues,
} from './activity-submission-requirements.service'

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

  if (
    !context.resolvedActivityConfig ||
    context.resolvedActivityConfig.interactionType === 'soflia_dialogue' ||
    !context.resolvedActivityConfig.validation.enabled
  ) {
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

  if (!(await isAiPurposeAvailable('activity_validation'))) {
    throw new CourseActivityError(
      'VALIDATION_UNAVAILABLE',
      503,
      'La validacion SofLIA no esta disponible: falta la clave del proveedor de IA configurado',
    )
  }

  try {
    const result = await generateAiText({
      circuitBreakerName: 'activity-validation',
      prompt: (profile: PromptModelProfile) =>
        selectPromptVariant(
          profile,
          {
            google: buildValidationPromptForGoogle,
            openai: buildValidationPromptForOpenAi,
          },
          { context, submission },
        ),
      purpose: 'activity_validation',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
    })

    // El gateway ya descarta las partes de razonamiento interno del modelo, que
    // romperian el parseo JSON o filtrarian texto no destinado al usuario.
    const feedback = parseGeminiJsonResponse(result.text)
    return {
      feedback,
      modelName: result.model,
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
