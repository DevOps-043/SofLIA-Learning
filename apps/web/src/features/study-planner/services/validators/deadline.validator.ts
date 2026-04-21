import type { ValidationResult, DeadlineValidation } from '../validation.service';

function suggestDeadlineAction(
  remainingMinutes: number,
  daysOverdue: number,
  currentWeeklyMinutes: number,
): string {
  const additionalWeeklyMinutes = Math.ceil(
    (remainingMinutes / Math.max(daysOverdue / 7, 1)) - currentWeeklyMinutes,
  );

  if (additionalWeeklyMinutes <= 60) {
    return `Aumenta tu tiempo de estudio en ${additionalWeeklyMinutes} minutos por semana.`;
  } else if (additionalWeeklyMinutes <= 180) {
    return `Dedica ${Math.round(additionalWeeklyMinutes / 60)} horas adicionales por semana a este curso.`;
  } else {
    return 'Contacta a tu administrador para solicitar una extensión del plazo.';
  }
}

export function validateB2BDeadlines(
  courses: Array<{
    courseId: string;
    courseTitle: string;
    dueDate?: string;
    remainingMinutes: number;
  }>,
  weeklyStudyMinutes: number,
  startDate: Date = new Date(),
): ValidationResult & { deadlineIssues: DeadlineValidation[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const deadlineIssues: DeadlineValidation[] = [];

  if (weeklyStudyMinutes <= 0) {
    return {
      isValid: false,
      errors: ['El tiempo de estudio semanal debe ser mayor a 0'],
      warnings,
      suggestions,
      deadlineIssues,
    };
  }

  let accumulatedMinutes = 0;

  for (const course of courses) {
    if (!course.dueDate) continue;

    const dueDate = new Date(course.dueDate);
    accumulatedMinutes += course.remainingMinutes;

    const weeksNeeded = accumulatedMinutes / weeklyStudyMinutes;
    const estimatedCompletionDate = new Date(startDate);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(weeksNeeded * 7));

    const canComplete = estimatedCompletionDate <= dueDate;

    const validation: DeadlineValidation = {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      dueDate: course.dueDate,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
      canComplete,
    };

    if (!canComplete) {
      const daysOverdue = Math.ceil(
        (estimatedCompletionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      validation.daysOverdue = daysOverdue;
      validation.suggestedAction = suggestDeadlineAction(
        course.remainingMinutes,
        daysOverdue,
        weeklyStudyMinutes,
      );
      errors.push(
        `"${course.courseTitle}" no se completará antes del plazo (${daysOverdue} días de retraso estimado).`,
      );
    } else {
      const marginDays = Math.ceil(
        (dueDate.getTime() - estimatedCompletionDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (marginDays < 3) {
        warnings.push(
          `"${course.courseTitle}" se completará con poco margen (${marginDays} día(s) antes del plazo).`,
        );
      }
    }

    deadlineIssues.push(validation);
  }

  if (errors.length > 0) {
    suggestions.push(
      'Considera aumentar las horas de estudio semanales o comenzar antes para cumplir con los plazos.',
    );
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions, deadlineIssues };
}
