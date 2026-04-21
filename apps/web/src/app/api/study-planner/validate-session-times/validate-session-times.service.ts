import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type {
  CalendarEvent,
  UserContext,
} from '../../../../features/study-planner/types/user-context.types';
import { validateCalendarConflicts } from './validate-session-times-calendar.service';
import { validateDeadlines } from './validate-session-times-deadline.service';

export interface ValidateSessionTimesRequest {
  courseIds: string[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredDays: number[];
  preferredTimeBlocks: Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>;
  calendarEvents?: CalendarEvent[];
  goalHoursPerWeek?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  minimumLessonTime: number;
  totalEstimatedMinutes: number;
  estimatedWeeksToComplete: number;
  meetsDeadlines: boolean;
  deadlineIssues?: Array<{
    courseId: string;
    courseTitle: string;
    dueDate: string;
    estimatedCompletionDate: string;
    daysOverdue: number;
  }>;
}

export interface ValidateSessionTimesResponse {
  success: boolean;
  data?: ValidationResult;
  error?: string;
}

export async function validateSessionTimesForUser(
  userId: string,
  userContext: UserContext,
  body: ValidateSessionTimesRequest,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const { minimumLessonTime, totalEstimatedMinutes } = await calculateCourseTimeRequirements(userId, body.courseIds);

  validateSessionDurations(body, minimumLessonTime, errors, warnings, suggestions);
  validatePreferredBlocks(body, errors, warnings);

  const effectiveMinutesPerWeek = calculateEffectiveMinutesPerWeek(body);
  const estimatedWeeksToComplete = effectiveMinutesPerWeek > 0
    ? Math.ceil(totalEstimatedMinutes / effectiveMinutesPerWeek)
    : 0;
  const deadlineResult = await validateDeadlines({
    userId,
    userContext,
    body,
    effectiveMinutesPerWeek,
    errors,
    suggestions,
  });

  validateCalendarConflicts(body, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    minimumLessonTime: Math.ceil(minimumLessonTime),
    totalEstimatedMinutes,
    estimatedWeeksToComplete,
    meetsDeadlines: deadlineResult.meetsDeadlines,
    deadlineIssues: deadlineResult.deadlineIssues.length > 0 ? deadlineResult.deadlineIssues : undefined,
  };
}

async function calculateCourseTimeRequirements(
  userId: string,
  courseIds: string[],
): Promise<{ minimumLessonTime: number; totalEstimatedMinutes: number }> {
  const courseAnalysisResults = await Promise.all(
    courseIds.map(async (courseId) => {
      const [minTime, remaining] = await Promise.all([
        CourseAnalysisService.getMinimumLessonTime(courseId),
        CourseAnalysisService.calculateRemainingTime(userId, courseId),
      ]);
      return { minTime, remainingMinutes: remaining.totalRemainingMinutes };
    }),
  );

  const minimumLessonTime = courseAnalysisResults.reduce(
    (minimum, result) => Math.min(minimum, result.minTime),
    Infinity,
  );

  return {
    minimumLessonTime: minimumLessonTime === Infinity ? 15 : minimumLessonTime,
    totalEstimatedMinutes: courseAnalysisResults.reduce(
      (total, result) => total + result.remainingMinutes,
      0,
    ),
  };
}

function validateSessionDurations(
  body: ValidateSessionTimesRequest,
  minimumLessonTime: number,
  errors: string[],
  warnings: string[],
  suggestions: string[],
): void {
  if (body.minSessionMinutes < minimumLessonTime) {
    errors.push(
      `El tiempo mÃ­nimo de sesiÃ³n (${body.minSessionMinutes} min) es menor que la lecciÃ³n mÃ¡s corta (${Math.ceil(minimumLessonTime)} min). ` +
      `Es importante completar al menos una lecciÃ³n por sesiÃ³n.`,
    );
    suggestions.push(`Aumenta el tiempo mÃ­nimo de sesiÃ³n a al menos ${Math.ceil(minimumLessonTime)} minutos.`);
  }

  if (body.maxSessionMinutes <= body.minSessionMinutes) {
    errors.push('El tiempo mÃ¡ximo de sesiÃ³n debe ser mayor que el tiempo mÃ­nimo.');
  }

  if (body.maxSessionMinutes > 180) {
    warnings.push('Las sesiones de mÃ¡s de 3 horas pueden afectar la concentraciÃ³n y retenciÃ³n.');
    suggestions.push('Considera dividir las sesiones largas con descansos mÃ¡s frecuentes.');
  }

  if (body.breakDurationMinutes < 5) {
    warnings.push('Los descansos muy cortos (menos de 5 minutos) pueden no ser suficientes para recuperar la concentraciÃ³n.');
  }
}

function validatePreferredBlocks(
  body: ValidateSessionTimesRequest,
  errors: string[],
  warnings: string[],
): void {
  if (!body.preferredDays || body.preferredDays.length === 0) {
    errors.push('Debes seleccionar al menos un dÃ­a para estudiar.');
  }

  if (!body.preferredTimeBlocks || body.preferredTimeBlocks.length === 0) {
    errors.push('Debes configurar al menos un bloque de tiempo para estudiar.');
  }

  for (const block of body.preferredTimeBlocks || []) {
    const blockMinutes = getBlockMinutes(block);
    if (blockMinutes < body.minSessionMinutes) {
      warnings.push(
        `El bloque de tiempo ${block.startHour}:${String(block.startMinute).padStart(2, '0')} - ` +
        `${block.endHour}:${String(block.endMinute).padStart(2, '0')} (${blockMinutes} min) ` +
        `es menor que el tiempo mÃ­nimo de sesiÃ³n (${body.minSessionMinutes} min).`,
      );
    }
  }
}

function calculateEffectiveMinutesPerWeek(body: ValidateSessionTimesRequest): number {
  const totalWeeklyMinutesAvailable = (body.preferredTimeBlocks || []).reduce(
    (total, block) => total + getBlockMinutes(block) * body.preferredDays.length,
    0,
  );

  return Math.min(
    totalWeeklyMinutesAvailable,
    body.goalHoursPerWeek ? body.goalHoursPerWeek * 60 : totalWeeklyMinutesAvailable,
  );
}

function getBlockMinutes(block: {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}): number {
  return (block.endHour * 60 + block.endMinute) - (block.startHour * 60 + block.startMinute);
}
