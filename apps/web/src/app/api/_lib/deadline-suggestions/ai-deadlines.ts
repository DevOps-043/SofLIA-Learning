import { logger as techDebtLogger } from '@/lib/utils/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'
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
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return fallback
  }

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent(buildDeadlinePrompt(context))
    const aiData = JSON.parse(result.response.text())

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
