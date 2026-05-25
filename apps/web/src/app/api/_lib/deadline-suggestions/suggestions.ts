import type {
  AiDeadlineReasoning,
  DeadlineApproach,
  DeadlineDays,
} from './types'

const COMPLETION_RATES: Record<DeadlineApproach, string> = {
  fast: '85%',
  balanced: '92%',
  long: '95%',
}

function createSuggestion(params: {
  days: number
  finalTotalHours: number
  key: DeadlineApproach
  reasoning: AiDeadlineReasoning
  startDate: Date
}) {
  const weeks = Math.max(0.14, params.days / 7)
  const impliedPace = Math.round((params.finalTotalHours / weeks) * 10) / 10
  const deadline = new Date(params.startDate)
  deadline.setDate(deadline.getDate() + params.days)
  deadline.setHours(23, 59, 59, 999)

  return {
    approach: params.key,
    deadline_date: deadline.toISOString(),
    duration_days: params.days,
    duration_weeks: Math.ceil(weeks),
    hours_per_week: impliedPace,
    description: params.reasoning[params.key],
    estimated_completion_rate: COMPLETION_RATES[params.key],
  }
}

export function buildDeadlineSuggestions(params: {
  deadlines: DeadlineDays
  finalTotalHours: number
  reasoning: AiDeadlineReasoning
  startDate: Date
}) {
  return (['fast', 'balanced', 'long'] as const).map((key) =>
    createSuggestion({
      days: params.deadlines[key],
      finalTotalHours: params.finalTotalHours,
      key,
      reasoning: params.reasoning,
      startDate: params.startDate,
    }),
  )
}

export function resolveStartDate(value: string | null): Date {
  const startDate = value ? new Date(value) : new Date()
  return Number.isNaN(startDate.getTime()) ? new Date() : startDate
}
