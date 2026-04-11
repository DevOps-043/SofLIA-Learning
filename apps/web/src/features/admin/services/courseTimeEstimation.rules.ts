import { normalizeActivityConfig } from '@/features/courses/types/activity-config'
import {
  deepParseJsonValue,
  normalizeContentForRenderer,
} from '@/lib/course-content'
import {
  calculateReadingTimeMinutes,
  countWords,
} from '@/lib/utils/readingTime'
import type {
  CourseTimeEstimationTarget,
  TimeEstimationAnalysis,
  TimeEstimationConfidence,
  TimeEstimationTargetType,
} from './courseTimeEstimation.types'

interface TimeRange {
  min: number
  max: number
}

const TIME_RANGES: Record<TimeEstimationTargetType, TimeRange> = {
  pdf: { min: 2, max: 45 },
  link: { min: 2, max: 20 },
  document: { min: 2, max: 45 },
  quiz: { min: 3, max: 20 },
  exercise: { min: 4, max: 14 },
  reading: { min: 1, max: 45 },
  reflection: { min: 3, max: 8 },
  discussion: { min: 4, max: 10 },
  ai_chat: { min: 3, max: 8 },
}

interface QuizQuestionLike {
  question?: unknown
  questionText?: unknown
}

function clamp(value: number, range: TimeRange): number {
  return Math.min(range.max, Math.max(range.min, value))
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizePlainText(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return stripHtml(value)
}

function getQuizQuestions(value: unknown): QuizQuestionLike[] {
  const parsed = deepParseJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is QuizQuestionLike => {
      return typeof item === 'object' && item !== null
    })
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  const record = parsed as Record<string, unknown>
  const questions = Array.isArray(record.questions)
    ? record.questions
    : Array.isArray(record.items)
      ? record.items
      : []

  return questions.filter((item): item is QuizQuestionLike => {
    return typeof item === 'object' && item !== null
  })
}

function extractQuizPlainText(value: unknown): string {
  return getQuizQuestions(value)
    .map((question) => {
      if (typeof question.question === 'string') {
        return question.question
      }

      if (typeof question.questionText === 'string') {
        return question.questionText
      }

      return ''
    })
    .filter(Boolean)
    .join(' ')
}

function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) {
    return []
  }

  const parsedPrompts = deepParseJsonValue(rawPrompts)
  if (Array.isArray(parsedPrompts)) {
    return parsedPrompts
      .map((prompt) => String(prompt).trim())
      .filter(Boolean)
  }

  if (typeof rawPrompts !== 'string') {
    return []
  }

  return rawPrompts
    .split('\n')
    .map((prompt) => prompt.trim())
    .filter(Boolean)
}

function getTargetRange(targetType: TimeEstimationTargetType): TimeRange {
  return TIME_RANGES[targetType]
}

function getTargetPlainText(target: CourseTimeEstimationTarget): string {
  const title = normalizePlainText(target.title)
  const description = normalizePlainText(target.description)
  const prompts = parsePromptList(target.aiPrompts).join(' ')

  if (target.targetType === 'quiz') {
    return [title, description, extractQuizPlainText(target.content)]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  const normalizedContent = normalizeContentForRenderer(target.content)

  return [title, description, normalizePlainText(normalizedContent), prompts]
    .filter(Boolean)
    .join(' ')
    .trim()
}

function buildConfidence(
  targetType: TimeEstimationTargetType,
  wordCount: number,
  questionCount: number,
): TimeEstimationConfidence {
  if (targetType === 'quiz' && questionCount > 0) {
    return 'high'
  }

  if (
    (targetType === 'reading' ||
      targetType === 'pdf' ||
      targetType === 'document') &&
    wordCount > 0
  ) {
    return 'high'
  }

  if (wordCount >= 40) {
    return 'medium'
  }

  return 'low'
}

export function analyzeTimeEstimationTarget(
  target: CourseTimeEstimationTarget,
): TimeEstimationAnalysis {
  const range = getTargetRange(target.targetType)
  const activityConfig = normalizeActivityConfig(target.activityConfig)
  const promptCount = parsePromptList(target.aiPrompts).length
  const questionCount = getQuizQuestions(target.content).length
  const plainText = getTargetPlainText(target)
  const wordCount = countWords(plainText)
  const plainTextExcerpt =
    plainText.length > 800 ? `${plainText.slice(0, 797)}...` : plainText
  const fieldCount =
    activityConfig?.interactionType === 'inline_answers'
      ? activityConfig.submission.fields.length
      : 0
  const checklistItemCount =
    activityConfig?.interactionType === 'checklist'
      ? activityConfig.submission.checklistItems.length
      : 0
  const requireEvidence =
    Boolean(activityConfig?.submission.requireEvidence) ||
    Boolean(target.requiresSofliaValidation)
  const hasExternalTool =
    Boolean(activityConfig?.toolTask?.toolKey) || Boolean(target.externalUrl)
  const reasons: string[] = []
  let deterministicMinutes = range.min

  switch (target.targetType) {
    case 'quiz': {
      deterministicMinutes =
        questionCount > 0
          ? clamp(Math.round(questionCount * 1.25 + 1), range)
          : 4
      reasons.push(
        questionCount > 0
          ? `Quiz con ${questionCount} preguntas y margen breve de revision.`
          : 'Quiz sin estructura legible; se usa un minimo razonable.',
      )
      break
    }

    case 'reading': {
      const readingMinutes = calculateReadingTimeMinutes(plainText || target.title)
      deterministicMinutes = clamp(readingMinutes, range)
      reasons.push(
        `Lectura estimada por conteo de palabras (${wordCount} palabras).`,
      )
      break
    }

    case 'pdf':
    case 'document': {
      const readingMinutes = wordCount > 0
        ? calculateReadingTimeMinutes(plainText)
        : range.min
      deterministicMinutes = clamp(readingMinutes + 1, range)
      reasons.push(
        wordCount > 0
          ? `Documento con lectura guiada y 1 minuto de margen (${wordCount} palabras).`
          : 'Documento sin texto extraible; se usa una base minima conservadora.',
      )
      break
    }

    case 'link': {
      const readingMinutes = wordCount > 0
        ? calculateReadingTimeMinutes(plainText)
        : 1
      deterministicMinutes = clamp(readingMinutes + 1, range)
      reasons.push(
        wordCount > 0
          ? 'Enlace con lectura breve y margen de navegacion.'
          : 'Enlace sin contenido legible; se considera solo una revision corta.',
      )
      break
    }

    case 'exercise': {
      const readingMinutes = wordCount > 0
        ? calculateReadingTimeMinutes(plainText)
        : 1
      const structureBoost =
        Math.min(2, fieldCount) +
        Math.min(2, checklistItemCount > 0 ? 1 : 0) +
        (requireEvidence ? 1 : 0) +
        (hasExternalTool ? 1 : 0)
      deterministicMinutes = clamp(readingMinutes + 2 + structureBoost, range)
      reasons.push(
        'Ejercicio con tiempo de lectura, ejecucion y margen breve de respuesta.',
      )
      break
    }

    case 'reflection': {
      const thoughtBoost = wordCount > 120 ? 1 : 0
      deterministicMinutes = clamp(
        3 + thoughtBoost + (requireEvidence ? 1 : 0) + (fieldCount > 0 ? 1 : 0),
        range,
      )
      reasons.push(
        'Reflexion breve con margen de escritura y procesamiento personal.',
      )
      break
    }

    case 'discussion': {
      deterministicMinutes = clamp(
        4 + (wordCount > 140 ? 1 : 0) + (requireEvidence ? 1 : 0),
        range,
      )
      reasons.push(
        'Discusion corta con tiempo para leer consigna y responder.',
      )
      break
    }

    case 'ai_chat': {
      deterministicMinutes = clamp(
        3 +
          Math.min(2, promptCount) +
          (wordCount > 180 ? 1 : 0) +
          (hasExternalTool ? 1 : 0),
        range,
      )
      reasons.push(
        'Interaccion con SofLIA estimada como conversacion breve, no sesion extensa.',
      )
      break
    }
  }

  return {
    target,
    deterministicMinutes,
    minMinutes: range.min,
    maxMinutes: range.max,
    confidence: buildConfidence(target.targetType, wordCount, questionCount),
    rationale: reasons.join(' '),
    signals: {
      questionCount,
      promptCount,
      wordCount,
      fieldCount,
      checklistItemCount,
      requireEvidence,
      hasExternalTool,
      plainTextExcerpt,
    },
  }
}
