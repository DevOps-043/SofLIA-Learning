import { deepParseJsonValue } from './json'

/**
 * Elimina la clave de respuestas de un quiz antes de enviarlo al alumno.
 *
 * SEGURIDAD: `lesson_materials.content_data` / `lesson_activities.activity_content`
 * contienen `correctAnswer` por pregunta. Enviarlo al navegador permite "saber los
 * resultados del quiz" antes de responder (inspeccionando la respuesta de red). La
 * calificación es autoritativa en el servidor (`grade-quiz.service.ts`), que lee la
 * clave directamente de BD; el cliente nunca la necesita para responder. La respuesta
 * correcta se revela SOLO después del envío, en la respuesta del endpoint de submit.
 *
 * Función pura e idempotente. Soporta las dos formas de contenido: arreglo de
 * preguntas o `{ questions: [...] }`. Preserva el resto del contenido (enunciado,
 * opciones, id, points, questionType, explanation).
 */

const ANSWER_KEY_FIELDS = ['correctAnswer', 'correct_answer'] as const

function stripQuestionAnswerKey(question: unknown): unknown {
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    return question
  }

  const sanitized: Record<string, unknown> = { ...(question as Record<string, unknown>) }
  for (const field of ANSWER_KEY_FIELDS) {
    delete sanitized[field]
  }
  return sanitized
}

export function stripQuizAnswerKey(content: unknown): unknown {
  const parsed = deepParseJsonValue(content)

  if (Array.isArray(parsed)) {
    return parsed.map(stripQuestionAnswerKey)
  }

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    if (Array.isArray(record.questions)) {
      return {
        ...record,
        questions: record.questions.map(stripQuestionAnswerKey),
      }
    }
  }

  return parsed
}
