import { applyComplexityAdjustments } from './course-deadline-adjustments'
import { addDays } from './course-deadline-date.utils'
import type {
  ApproachSuggestion,
  CourseMetadata,
  DeadlineApproach,
  DeadlineSuggestionsResult,
} from './course-deadline-calculator.types'

function buildSuggestion(
  approach: DeadlineApproach,
  days: number,
  hoursPerWeek: number,
  description: string,
  estimatedCompletionRate: string,
  startDate: Date,
): ApproachSuggestion {
  return {
    approach,
    deadline_date: addDays(startDate, days).toISOString(),
    duration_days: days,
    duration_weeks: Math.ceil(days / 7),
    hours_per_week: hoursPerWeek,
    description,
    estimated_completion_rate: estimatedCompletionRate,
  }
}

export function calculateDeadlineSuggestions(
  courseId: string,
  courseTitle: string,
  metadata: CourseMetadata,
  startDate: Date = new Date(),
): DeadlineSuggestionsResult {
  const totalHours = metadata.duration_total_minutes / 60
  const adjustedHours = totalHours * 1.1

  const fastHoursPerWeek = 12
  let fastDays = Math.ceil((adjustedHours / fastHoursPerWeek) * 7)
  fastDays = applyComplexityAdjustments(fastDays, metadata, 'fast')
  fastDays = Math.max(3, Math.min(21, fastDays))

  const balancedHoursPerWeek = 4
  let balancedDays = Math.ceil((adjustedHours / balancedHoursPerWeek) * 7)
  balancedDays = applyComplexityAdjustments(balancedDays, metadata, 'balanced')
  balancedDays = Math.max(7, Math.min(60, balancedDays))

  const longHoursPerWeek = 2
  let longDays = Math.ceil((adjustedHours / longHoursPerWeek) * 7)
  longDays = applyComplexityAdjustments(longDays, metadata, 'long')
  longDays = Math.max(14, Math.min(120, longDays))

  return {
    course_id: courseId,
    course_title: courseTitle,
    metadata,
    suggestions: [
      buildSuggestion('fast', fastDays, fastHoursPerWeek, 'Completa el curso rÃ¡pidamente con dedicaciÃ³n intensiva', '85%', startDate),
      buildSuggestion('balanced', balancedDays, balancedHoursPerWeek, 'Ritmo moderado y sostenible para profesionales', '92%', startDate),
      buildSuggestion('long', longDays, longHoursPerWeek, 'Aprendizaje profundo con tiempo para reflexiÃ³n', '95%', startDate),
    ],
    calculated_at: new Date().toISOString(),
  }
}
