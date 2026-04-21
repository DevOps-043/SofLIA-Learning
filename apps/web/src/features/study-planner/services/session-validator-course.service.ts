import { LessonTimeService } from './lesson-time.service';
import type {
  B2BAssignment,
  B2BDeadlineValidation,
  SessionTimeValidation,
} from './session-validator.types';

export async function validateSessionTimes(
  minMinutes: number,
  maxMinutes: number,
  courseIds: string[]
): Promise<SessionTimeValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const analysis = await LessonTimeService.analyzeCoursesTime(courseIds);
  const requiredMinSession = analysis.recommendedMinSessionMinutes;

  if (minMinutes < requiredMinSession) {
    errors.push(
      `El tiempo mÃ­nimo de ${minMinutes} minutos no es suficiente. ` +
      `La lecciÃ³n mÃ¡s larga dura ${analysis.globalMaxLessonMinutes} minutos. ` +
      `El tiempo mÃ­nimo debe ser de al menos ${requiredMinSession} minutos.`
    );
  }

  if (maxMinutes < minMinutes) {
    errors.push('El tiempo mÃ¡ximo debe ser mayor o igual al tiempo mÃ­nimo.');
  }

  if (minMinutes < 15) {
    warnings.push('Sesiones menores a 15 minutos pueden no ser efectivas para el aprendizaje.');
  }

  if (maxMinutes > 180) {
    warnings.push('Sesiones mayores a 3 horas pueden causar fatiga. Considera dividirlas.');
    suggestions.push('Te recomendamos sesiones de mÃ¡ximo 90-120 minutos con descansos.');
  }

  if (analysis.globalAverageLessonMinutes > 0) {
    const recommendedSession = Math.max(
      analysis.globalAverageLessonMinutes + 10,
      analysis.globalMaxLessonMinutes
    );
    suggestions.push(
      `Basado en tus cursos, te recomendamos sesiones de ${recommendedSession}-${recommendedSession + 15} minutos.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    minSessionMinutes: requiredMinSession,
    maxSessionMinutes: Math.max(maxMinutes, requiredMinSession),
    recommendedMinutes: analysis.globalAverageLessonMinutes + 10
  };
}

export async function validateB2BDeadlines(
  assignments: B2BAssignment[],
  weeklyStudyMinutes: number,
  courseIds: string[]
): Promise<B2BDeadlineValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const relevantAssignments = assignments.filter(
    a => a.due_date && courseIds.includes(a.course_id) && a.status !== 'completed'
  );

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
      suggestions
    };
  }

  const sortedAssignments = relevantAssignments.sort((a, b) => {
    const dateA = new Date(a.due_date!);
    const dateB = new Date(b.due_date!);
    return dateA.getTime() - dateB.getTime();
  });

  const nearestDeadline = new Date(sortedAssignments[0].due_date!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nearestDeadline.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((nearestDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weeksRemaining = Math.max(daysRemaining / 7, 0.5);
  const analysis = await LessonTimeService.analyzeCoursesTime(courseIds);
  let remainingMinutes = 0;

  for (const assignment of relevantAssignments) {
    const courseAnalysis = analysis.courses.find(c => c.courseId === assignment.course_id);
    if (courseAnalysis) {
      const progressDecimal = assignment.completion_percentage / 100;
      remainingMinutes += courseAnalysis.totalMinutes * (1 - progressDecimal);
    }
  }

  const requiredWeeklyMinutes = Math.ceil(remainingMinutes / weeksRemaining);
  const canMeetDeadline = weeklyStudyMinutes >= requiredWeeklyMinutes;

  if (!canMeetDeadline) {
    errors.push(
      `Para cumplir con la fecha lÃ­mite del ${nearestDeadline.toLocaleDateString('es-ES')}, ` +
      `necesitas estudiar al menos ${requiredWeeklyMinutes} minutos por semana. ` +
      `Tu configuraciÃ³n actual es de ${weeklyStudyMinutes} minutos semanales.`
    );
    suggestions.push(
      `Aumenta tu tiempo de estudio semanal a ${requiredWeeklyMinutes} minutos, ` +
      `o considera extender tu plazo si es posible.`
    );
  }

  if (daysRemaining <= 7 && !canMeetDeadline) {
    warnings.push(
      `Â¡AtenciÃ³n! La fecha lÃ­mite estÃ¡ a menos de una semana. ` +
      `Es posible que necesites intensificar tu ritmo de estudio.`
    );
  }

  if (daysRemaining <= 0) {
    errors.push('La fecha lÃ­mite ya ha pasado.');
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
    suggestions
  };
}
