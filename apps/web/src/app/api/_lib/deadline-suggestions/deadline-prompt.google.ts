import type { AggregatedCourseDeadlineContext } from './types'

/**
 * VARIANTE GEMINI del prompt de plazos recomendados. TEXTO ORIGINAL, CONGELADO.
 *
 * No se toca para mejorar OpenAI: para eso existe `deadline-prompt.openai.ts`.
 */

export function buildDeadlinePromptForGoogle(
  context: AggregatedCourseDeadlineContext,
): string {
  return `
    Calculate the RECOMMENDED DEADLINES for this course.

    HARD DATA (Summed from Database):
    - Total Real Content Duration: ${context.finalTotalHours.toFixed(2)} hours
    - Breakdown: Video ${context.totalVideoMinutes}m + Reading ${context.totalReadingMinutes}m + Practice ${context.totalActivityMinutes}m

    COURSE CONTEXT:
    ${context.syllabusContext.substring(0, 4000)}

    INSTRUCTIONS:
    The system has computed a raw duration of ${context.finalTotalHours.toFixed(2)} hours.
    However, raw hours != learning days.

    Determine the Learning Efficiency Factor based on Cognitive Load.
    - High Cognitive Load (Coding, Math): Pace is slower.
    - Low Cognitive Load (History, Soft Skills): Pace is standard.

    Standard Paces:
    - Fast: ~12h/week
    - Balanced: ~4h/week
    - Long: ~2h/week

    Return JSON:
    {
      "deadlines": {
        "fast_days": number,
        "balanced_days": number,
        "long_days": number
      },
      "reasoning_summary": "One sentence reasoning.",
      "approaches_desc": {
        "fast": "short motivational text",
        "balanced": "short text",
        "long": "short text"
      }
    }
  `
}
