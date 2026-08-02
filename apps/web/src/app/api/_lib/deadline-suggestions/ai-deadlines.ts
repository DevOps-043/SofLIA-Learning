import type { PromptModelProfile } from '@/lib/ai/prompts'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { buildDeadlinePrompt } from './deadline-prompt'
import type {
  AggregatedCourseDeadlineContext,
  AiDeadlineReasoning,
  DeadlineDays,
} from './types'

const BASELINE_PACES = {
  fast: 12,
  balanced: 4,
  long: 2,
}

function buildFallback(context: AggregatedCourseDeadlineContext) {
  return {
    deadlines: {
      fast: Math.max(2, Math.ceil((context.finalTotalHours / BASELINE_PACES.fast) * 7)),
      balanced: Math.max(5, Math.ceil((context.finalTotalHours / BASELINE_PACES.balanced) * 7)),
      long: Math.max(10, Math.ceil((context.finalTotalHours / BASELINE_PACES.long) * 7)),
    },
    reasoning: {
      summary: `Estimacion basada en contenido: ${context.finalTotalHours.toFixed(1)}h totales.`,
      fast: 'Ritmo intensivo.',
      balanced: 'Ritmo moderado.',
      long: 'Ritmo pausado.',
    },
  }
}

export async function calculateDeadlineOptions(
  context: AggregatedCourseDeadlineContext,
): Promise<{ deadlines: DeadlineDays; reasoning: AiDeadlineReasoning }> {
  const fallback = buildFallback(context)

  if (!(await isAiPurposeAvailable('course_time_estimation'))) {
    return fallback
  }

  try {
    // Comparte el propósito `course_time_estimation`: ambas llamadas estiman
    // esfuerzo a partir del contenido del curso y no tiene sentido que un
    // administrador las configure por separado.
    const result = await generateAiText({
      circuitBreakerName: 'deadline-suggestions',
      prompt: (profile: PromptModelProfile) => buildDeadlinePrompt(profile, context),
      purpose: 'course_time_estimation',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
    })
    const aiData = JSON.parse(result.text)

    return {
      deadlines: {
        fast: Math.max(1, Number(aiData.deadlines?.fast_days)),
        balanced: Math.max(3, Number(aiData.deadlines?.balanced_days)),
        long: Math.max(7, Number(aiData.deadlines?.long_days)),
      },
      reasoning: {
        ...fallback.reasoning,
        ...aiData.approaches_desc,
        summary: aiData.reasoning_summary || fallback.reasoning.summary,
      },
    }
  } catch (error) {
    techDebtLogger.error('LIA Calculation failed (using math fallback):', error)
    return fallback
  }
}
