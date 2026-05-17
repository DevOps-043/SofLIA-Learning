import { calculateReadingTimeMinutes } from '@/lib/utils/readingTime'
import { clamp } from './ranges'
import type { DurationEstimate, DurationStrategyInput } from './duration'

export function estimateQuizDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  const deterministicMinutes =
    signals.questionCount > 0
      ? clamp(Math.round(signals.questionCount * 1.25 + 1), range)
      : 4

  return {
    deterministicMinutes,
    rationale:
      signals.questionCount > 0
        ? `Quiz con ${signals.questionCount} preguntas y margen breve de revision.`
        : 'Quiz sin estructura legible; se usa un minimo razonable.',
  }
}

export function estimateReadingDuration({
  range,
  signals,
  target,
}: DurationStrategyInput): DurationEstimate {
  return {
    deterministicMinutes: clamp(
      calculateReadingTimeMinutes(signals.plainText || target.title),
      range,
    ),
    rationale: `Lectura estimada por conteo de palabras (${signals.wordCount} palabras).`,
  }
}

export function estimateDocumentDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  const readingMinutes =
    signals.wordCount > 0
      ? calculateReadingTimeMinutes(signals.plainText)
      : range.min

  return {
    deterministicMinutes: clamp(readingMinutes + 1, range),
    rationale:
      signals.wordCount > 0
        ? `Documento con lectura guiada y 1 minuto de margen (${signals.wordCount} palabras).`
        : 'Documento sin texto extraible; se usa una base minima conservadora.',
  }
}

export function estimateLinkDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  const readingMinutes =
    signals.wordCount > 0
      ? calculateReadingTimeMinutes(signals.plainText)
      : 1

  return {
    deterministicMinutes: clamp(readingMinutes + 1, range),
    rationale:
      signals.wordCount > 0
        ? 'Enlace con lectura breve y margen de navegacion.'
        : 'Enlace sin contenido legible; se considera solo una revision corta.',
  }
}
