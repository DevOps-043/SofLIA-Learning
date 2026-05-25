import { groupDistributionsByDay } from './planner-lesson-distribution.service'
import type { StudyPlannerLessonDistributionResult } from './planner-lesson-distribution.service'

export function buildRecommendationDistributionDetails(
  distributionResult: StudyPlannerLessonDistributionResult,
): string {
  let message = ''
  const distributionsByDay = groupDistributionsByDay(distributionResult.computedDistribution)
  const sortedDays = Array.from(distributionsByDay.keys()).sort((l, r) => l.localeCompare(r))

  sortedDays.forEach((dateStr) => {
    const dayDistributions = distributionsByDay.get(dateStr)
    if (!dayDistributions || dayDistributions.length === 0) return

    dayDistributions.sort((l, r) => l.slot.start.getTime() - r.slot.start.getTime())
    const displayDate = new Date(`${dateStr}T00:00:00`)
    const formattedDate = displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

    message += `\n${dayDistributions[0].slot.dayName} ${formattedDate}:\n`
    dayDistributions.forEach((distribution) => {
      const totalMinutes = distribution.lessons.reduce((sum, l) => sum + (l.durationMinutes || 15), 0)
      const adjustedEnd = new Date(distribution.slot.start.getTime() + totalMinutes * 60000)
      const startTime = distribution.slot.start.toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false, minute: '2-digit' })
      const endTime = adjustedEnd.toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false, minute: '2-digit' })
      message += `   HORARIO EXACTO: ${startTime} - ${endTime} (${totalMinutes} min):\n`
      distribution.lessons.forEach((lesson) => {
        message += `   - ${lesson.lessonTitle} (${lesson.durationMinutes || 15} min)\n`
      })
      message += '\n'
    })
  })

  return message
}
