import { z } from 'zod'

const lessonProgressRequestSchema = z.object({}).strict()

export interface LessonProgressRequestValidationError {
  error: string
  details?: unknown
  status: number
}

function buildValidationError(error: string) {
  return {
    error,
    status: 400,
  }
}

export function parseLessonProgressRequestBody(bodyText: string) {
  let parsedBody: unknown = {}

  if (bodyText.trim().length > 0) {
    try {
      parsedBody = JSON.parse(bodyText)
    } catch {
      return {
        error: buildValidationError('El cuerpo de la solicitud debe ser JSON valido'),
      }
    }
  }

  const parsed = lessonProgressRequestSchema.safeParse(parsedBody)
  if (!parsed.success) {
    return {
      error: {
        error: 'La solicitud no acepta campos adicionales',
        details: parsed.error.flatten(),
        status: 400,
      },
    }
  }

  return { data: parsed.data }
}
