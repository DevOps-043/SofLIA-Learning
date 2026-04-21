import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type { UserContext } from '../../../../features/study-planner/types/user-context.types';
import type {
  ValidateSessionTimesRequest,
  ValidationResult,
} from './validate-session-times.service';

export async function validateDeadlines(params: {
  userId: string;
  userContext: UserContext;
  body: ValidateSessionTimesRequest;
  effectiveMinutesPerWeek: number;
  errors: string[];
  suggestions: string[];
}): Promise<{ meetsDeadlines: boolean; deadlineIssues: NonNullable<ValidationResult['deadlineIssues']> }> {
  const deadlineIssues: NonNullable<ValidationResult['deadlineIssues']> = [];
  let meetsDeadlines = true;

  if (params.userContext.userType !== 'b2b') {
    return { meetsDeadlines, deadlineIssues };
  }

  const now = new Date();
  let weeksUsed = 0;

  for (const courseAssignment of params.userContext.courses) {
    if (!courseAssignment.dueDate || !params.body.courseIds.includes(courseAssignment.courseId)) {
      continue;
    }

    const dueDate = new Date(courseAssignment.dueDate);
    const remaining = await CourseAnalysisService.calculateRemainingTime(params.userId, courseAssignment.courseId);
    const weeksForCourse = params.effectiveMinutesPerWeek > 0
      ? Math.ceil(remaining.totalRemainingMinutes / params.effectiveMinutesPerWeek)
      : 0;
    const estimatedCompletionDate = new Date(now);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + (weeksUsed + weeksForCourse) * 7);

    if (estimatedCompletionDate > dueDate) {
      meetsDeadlines = false;
      addDeadlineIssue({
        courseAssignment,
        dueDate,
        estimatedCompletionDate,
        deadlineIssues,
        errors: params.errors,
        suggestions: params.suggestions,
      });
    }

    weeksUsed += weeksForCourse;
  }

  return { meetsDeadlines, deadlineIssues };
}

function addDeadlineIssue(params: {
  courseAssignment: UserContext['courses'][number];
  dueDate: Date;
  estimatedCompletionDate: Date;
  deadlineIssues: NonNullable<ValidationResult['deadlineIssues']>;
  errors: string[];
  suggestions: string[];
}): void {
  const { courseAssignment, dueDate, estimatedCompletionDate } = params;
  const daysOverdue = Math.ceil((estimatedCompletionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  params.deadlineIssues.push({
    courseId: courseAssignment.courseId,
    courseTitle: courseAssignment.course.title,
    dueDate: courseAssignment.dueDate!,
    estimatedCompletionDate: estimatedCompletionDate.toISOString(),
    daysOverdue,
  });

  params.errors.push(
    `El curso "${courseAssignment.course.title}" tiene fecha lÃ­mite ${new Date(courseAssignment.dueDate!).toLocaleDateString()}, ` +
    `pero con la configuraciÃ³n actual se completarÃ­a aproximadamente ${daysOverdue} dÃ­as despuÃ©s.`,
  );
  params.suggestions.push(
    `Para completar "${courseAssignment.course.title}" a tiempo, considera aumentar las horas de estudio ` +
    `o comenzar con este curso primero.`,
  );
}
