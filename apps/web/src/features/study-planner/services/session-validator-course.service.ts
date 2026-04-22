import { LessonTimeService } from './lesson-time.service'
import type {
  B2BAssignment,
  B2BDeadlineValidation,
  SessionTimeValidation,
} from './session-validator.types'

export async function validateSessionTimes(
  minMinutes: number,
  maxMinutes: number,
  courseIds: string[],
): Promise<SessionTimeValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  const analysis = await LessonTimeService.analyzeCoursesTime(courseIds)
  const requiredMinSession = analysis.recommendedMinSessionMinutes

  if (minMinutes < requiredMinSession) {
    errors.push(
      `El tiempo mínimo de ${minMinutes} minutos no es suficiente. `
      + `La lección más larga dura ${analysis.globalMaxLessonMinutes} minutos. `
      + `El tiempo mínimo debe ser de al menos ${requiredMinSession} minutos.`,
    )
  }

  if (maxMinutes < minMinutes) {
    errors.push('El tiempo máximo debe ser mayor o igual al tiempo mínimo.')
  }

  if (minMinutes < 15) {
    warnings.push('Sesiones menores a 15 minutos pueden no ser efectivas para el aprendizaje.')
  }

  if (maxMinutes > 180) {
    warnings.push('Sesiones mayores a 3 horas pueden causar fatiga. Considera dividirlas.')
    suggestions.push('Te recomendamos sesiones de máximo 90-120 minutos con descansos.')
  }

  if (analysis.globalAverageLessonMinutes > 0) {
    const recommendedSession = Math.max(
      analysis.globalAverageLessonMinutes + 10,
      analysis.globalMaxLessonMinutes,
    )
    suggestions.push(
      `Basado en tus cursos, te recomendamos sesiones de ${recommendedSession}-${recommendedSession + 15} minutos.`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    minSessionMinutes: requiredMinSession,
    maxSessionMinutes: Math.max(maxMinutes, requiredMinSession),
    recommendedMinutes: analysis.globalAverageLessonMinutes + 10,
  }
}

export async function validateB2BDeadlines(
  assignments: B2BAssignment[],
  weeklyStudyMinutes: number,
  courseIds: string[],
): Promise<B2BDeadlineValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  const relevantAssignments = assignments.filter(
    (assignment) => assignment.due_date && courseIds.includes(assignment.course_id) && assignment.status !== 'completed',
  )

  if (relevantAssignments.length === 0) {
    return {
      isValid: true,
      canMeetDeadline: true,
      requiredWeeklyMinutes: 0,
      proposedWeeklyMinutes: weeklyStudyMinutes,
      daysRemaining: Infinity,
      deadlineDate: null,
      errors,
      warnings,
      suggestions,
    }
  }

  const sortedAssignments = relevantAssignments.sort((left, right) => {
    const dateA = new Date(left.due_date!)
    const dateB = new Date(right.due_date!)
    return dateA.getTime() - dateB.getTime()
  })

  const nearestDeadline = new Date(sortedAssignments[0].due_date!)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nearestDeadline.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil(
    (nearestDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  const weeksRemaining = Math.max(daysRemaining / 7, 0.5)
  const analysis = await LessonTimeService.analyzeCoursesTime(courseIds)
  let remainingMinutes = 0

  for (const assignment of relevantAssignments) {
    const courseAnalysis = analysis.courses.find((course) => course.courseId === assignment.course_id)
    if (courseAnalysis) {
      const progressDecimal = assignment.completion_percentage / 100
      remainingMinutes += courseAnalysis.totalMinutes * (1 - progressDecimal)
    }
  }

  const requiredWeeklyMinutes = Math.ceil(remainingMinutes / weeksRemaining)
  const canMeetDeadline = weeklyStudyMinutes >= requiredWeeklyMinutes

  if (!canMeetDeadline) {
    errors.push(
      `Para cumplir con la fecha límite del ${nearestDeadline.toLocaleDateString('es-ES')}, `
      + `necesitas estudiar al menos ${requiredWeeklyMinutes} minutos por semana. `
      + `Tu configuración actual es de ${weeklyStudyMinutes} minutos semanales.`,
    )
    suggestions.push(
      `Aumenta tu tiempo de estudio semanal a ${requiredWeeklyMinutes} minutos, `
      + 'o considera extender tu plazo si es posible.',
    )
  }

  if (daysRemaining <= 7 && !canMeetDeadline) {
    warnings.push(
      `¡Atención! La fecha límite está a menos de una semana. `
      + 'Es posible que necesites intensificar tu ritmo de estudio.',
    )
  }

  if (daysRemaining <= 0) {
    errors.push('La fecha límite ya ha pasado.')
  }

  return {
    isValid: errors.length === 0,
    canMeetDeadline,
    requiredWeeklyMinutes,
    proposedWeeklyMinutes: weeklyStudyMinutes,
    daysRemaining,
    deadlineDate: nearestDeadline,
    errors,
    warnings,
    suggestions,
  }
}
