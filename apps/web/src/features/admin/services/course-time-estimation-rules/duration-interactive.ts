import { calculateReadingTimeMinutes } from '@/lib/utils/readingTime'
import { clamp } from './ranges'
import type { DurationEstimate, DurationStrategyInput } from './duration'

export function estimateExerciseDuration({
  range,
  signals,
  target,
}: DurationStrategyInput): DurationEstimate {
  const structureBoost =
    Math.min(2, signals.fieldCount) +
    Math.min(2, signals.checklistItemCount > 0 ? 1 : 0) +
    (signals.requireEvidence ? 1 : 0) +
    (signals.hasExternalTool ? 1 : 0)

  return {
    deterministicMinutes: clamp(
      calculateReadingTimeMinutes(signals.plainText || target.title) +
        2 +
        structureBoost,
      range,
    ),
    rationale:
      'Ejercicio con tiempo de lectura, ejecucion y margen breve de respuesta.',
  }
}

export function estimateReflectionDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  return {
    deterministicMinutes: clamp(
      3 +
        (signals.wordCount > 120 ? 1 : 0) +
        (signals.requireEvidence ? 1 : 0) +
        (signals.fieldCount > 0 ? 1 : 0),
      range,
    ),
    rationale:
      'Reflexion breve con margen de escritura y procesamiento personal.',
  }
}

export function estimateDiscussionDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  return {
    deterministicMinutes: clamp(
      4 +
        (signals.wordCount > 140 ? 1 : 0) +
        (signals.requireEvidence ? 1 : 0),
      range,
    ),
    rationale: 'Discusion corta con tiempo para leer consigna y responder.',
  }
}

export function estimateAiChatDuration({
  range,
  signals,
}: DurationStrategyInput): DurationEstimate {
  return {
    deterministicMinutes: clamp(
      3 +
        Math.min(2, signals.promptCount) +
        (signals.wordCount > 180 ? 1 : 0) +
        (signals.hasExternalTool ? 1 : 0),
      range,
    ),
    rationale:
      'Interaccion con SofLIA estimada como conversacion breve, no sesion extensa.',
  }
}
