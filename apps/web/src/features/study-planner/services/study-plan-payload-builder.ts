import type { StudyPlannerScheduledLesson } from '../types/planner-schedule.types';
import type { StudyApproach } from '../types/planner-ui.types';
import {
  parsePlannerDateString,
  parsePlannerTimeString,
} from './lesson-distribution.service';
import type {
  BuildStudyPlanPayloadParams,
  StudyPlanPreferredTimeBlock,
  StudyPlanSavePayload,
  StudyPlanSessionLessonPayload,
  StudyPlanSessionPayload,
  StudyPlannerSessionType,
} from './study-plan-persistence.types';

export function getPureCourseId(id: string): string {
  if (!id) return '';
  return id.split('__')[0] || id;
}

function calculateGoalHoursPerWeek(distribution: BuildStudyPlanPayloadParams['savedLessonDistribution']): number {
  const totalMinutes = distribution.reduce((acc, slot) => {
    const startMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
    const endMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
    if (!startMatch || !endMatch) return acc;
    const start = Number.parseInt(startMatch[1], 10) * 60 + Number.parseInt(startMatch[2], 10);
    const end = Number.parseInt(endMatch[1], 10) * 60 + Number.parseInt(endMatch[2], 10);
    const duration = end - start;
    return acc + (duration > 0 ? duration : 0);
  }, 0);

  if (distribution.length === 0 || totalMinutes <= 0) return 5;

  const dates = distribution
    .map((slot) => parsePlannerDateString(slot.dateStr))
    .filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime())));

  if (dates.length === 0) return 5;

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const daysDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, daysDiff / 7);
  const goalHoursPerWeek = Math.round((totalMinutes / 60 / weeks) * 10) / 10;
  return goalHoursPerWeek < 1 ? 5 : goalHoursPerWeek;
}

function extractPreferredDays(distribution: BuildStudyPlanPayloadParams['savedLessonDistribution']): number[] {
  const preferredDays = new Set<number>();
  distribution.forEach((slot) => {
    const date = parsePlannerDateString(slot.dateStr);
    if (date && !Number.isNaN(date.getTime())) preferredDays.add(date.getDay());
  });
  const sorted = Array.from(preferredDays).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [1, 2, 3, 4, 5];
}

function extractPreferredTimeBlocks(
  distribution: BuildStudyPlanPayloadParams['savedLessonDistribution'],
): StudyPlanPreferredTimeBlock[] {
  const timeBlocks = new Map<string, StudyPlanPreferredTimeBlock>();
  distribution.forEach((slot) => {
    const startTime = parsePlannerTimeString(slot.startTime);
    const endTime = parsePlannerTimeString(slot.endTime);
    if (!startTime || !endTime) return;
    const key = [startTime.hours, startTime.minutes, endTime.hours, endTime.minutes].join(':');
    if (!timeBlocks.has(key)) {
      timeBlocks.set(key, {
        startHour: startTime.hours,
        startMinute: startTime.minutes,
        endHour: endTime.hours,
        endMinute: endTime.minutes,
      });
    }
  });
  const blocks = Array.from(timeBlocks.values());
  return blocks.length > 0 ? blocks : [{ startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 }];
}

function resolveSessionPreferences(studyApproach: StudyApproach | null) {
  if (studyApproach === 'corto') {
    return { preferredSessionType: 'long' as const, minSessionMinutes: 60, maxSessionMinutes: 90, breakDurationMinutes: 15 };
  }
  if (studyApproach === 'largo') {
    return { preferredSessionType: 'short' as const, minSessionMinutes: 20, maxSessionMinutes: 35, breakDurationMinutes: 5 };
  }
  return { preferredSessionType: 'medium' as const, minSessionMinutes: 45, maxSessionMinutes: 60, breakDurationMinutes: 10 };
}

function buildSessionTitle(courseTitle: string): string {
  const normalizedCourseTitle = courseTitle.trim();
  return normalizedCourseTitle
    ? `Sesión de estudio de ${normalizedCourseTitle}`
    : 'Sesión de estudio';
}

function buildSessionDescription(lessons: StudyPlannerScheduledLesson[]): string {
  const description = lessons
    .filter((l) => l.lessonTitle && l.lessonTitle.trim() !== '')
    .map((l, i) => `${i + 1}. ${l.lessonTitle.trim()}`)
    .join('\n');
  return description || 'Sesion de estudio programada';
}

function sanitizePlannedLessons(
  lessons: StudyPlannerScheduledLesson[],
  fallbackCourseId: string,
): StudyPlanSessionLessonPayload[] {
  return lessons
    .filter((l) => l.lessonTitle && l.lessonTitle.trim() !== '')
    .map((l) => ({
      courseId: l.courseId || fallbackCourseId,
      courseTitle: l.courseTitle,
      lessonId: l.lessonId,
      lessonTitle: l.lessonTitle.trim(),
      lessonOrderIndex: l.lessonOrderIndex,
      durationMinutes: l.durationMinutes,
      moduleTitle: l.moduleTitle,
      moduleOrderIndex: l.moduleOrderIndex,
    }));
}

export function buildStudyPlanPayload(params: BuildStudyPlanPayloadParams): StudyPlanSavePayload {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const goalHoursPerWeek = calculateGoalHoursPerWeek(params.savedLessonDistribution);
  const preferredDays = extractPreferredDays(params.savedLessonDistribution);
  const preferredTimeBlocks = extractPreferredTimeBlocks(params.savedLessonDistribution);
  const sessionPreferences = resolveSessionPreferences(params.studyApproach);

  const firstSlotDate = params.savedLessonDistribution[0]
    ? parsePlannerDateString(params.savedLessonDistribution[0].dateStr)
    : null;
  const startDate =
    firstSlotDate && !Number.isNaN(firstSlotDate.getTime())
      ? firstSlotDate.toISOString()
      : new Date().toISOString();

  const lastSlotDate =
    params.savedLessonDistribution.length > 0
      ? parsePlannerDateString(
        params.savedLessonDistribution[params.savedLessonDistribution.length - 1].dateStr,
      )
      : null;
  const parsedTargetDate = params.savedTargetDate
    ? parsePlannerDateString(params.savedTargetDate)
    : null;
  const validTargetDate =
    parsedTargetDate && !Number.isNaN(parsedTargetDate.getTime()) ? parsedTargetDate : null;

  const endDate = validTargetDate
    ? validTargetDate.toISOString()
    : lastSlotDate && !Number.isNaN(lastSlotDate.getTime())
      ? lastSlotDate.toISOString()
      : undefined;

  const sessions = params.savedLessonDistribution.map((slot) => {
    const date = parsePlannerDateString(slot.dateStr) ?? new Date();
    const startTimeParts = parsePlannerTimeString(slot.startTime) ?? { hours: 9, minutes: 0 };
    const endTimeParts = parsePlannerTimeString(slot.endTime) ?? { hours: 10, minutes: 0 };

    const startTime = new Date(date);
    const endTime = new Date(date);
    startTime.setHours(startTimeParts.hours, startTimeParts.minutes, 0, 0);
    endTime.setHours(endTimeParts.hours, endTimeParts.minutes, 0, 0);
    if (endTime <= startTime) endTime.setTime(startTime.getTime() + 60 * 60 * 1000);

    const firstLesson = slot.lessons[0];
    const courseTitle = firstLesson?.courseTitle ?? 'Curso';
    const course = params.availableCourses.find(
      (c) => c.title === courseTitle || params.selectedCourseIds.includes(c.id),
    );
    const resolvedCourseId = getPureCourseId(
      course?.courseId
        ?? params.availableCourses.find((c) => params.selectedCourseIds.includes(c.id))?.courseId
        ?? params.selectedCourseIds[0]
        ?? '',
    );

    const sessionPayload: StudyPlanSessionPayload = {
      clientReferenceId: slot.clientReferenceId,
      title: buildSessionTitle(courseTitle),
      description: buildSessionDescription(slot.lessons),
      courseId: resolvedCourseId,
      plannedLessons: sanitizePlannedLessons(slot.lessons, resolvedCourseId),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
      isAiGenerated: true as const,
      sessionType: sessionPreferences.preferredSessionType as StudyPlannerSessionType,
    };

    if (firstLesson?.lessonId) {
      sessionPayload.lessonId = firstLesson.lessonId;
    }

    return sessionPayload;
  });

  if (sessions.length === 0) throw new Error('No hay sesiones para guardar');
  if (preferredDays.length === 0) throw new Error('No se pudieron determinar los dias preferidos');

  const selectedCourse = params.availableCourses.find((c) => params.selectedCourseIds.includes(c.id));
  const courseName = selectedCourse?.title?.trim() || 'Curso';
  const selectedOrganizationIds = Array.from(
    new Set(
      params.availableCourses
        .filter((c) => params.selectedCourseIds.includes(c.id))
        .map((c) => c.organizationId)
        .filter((id): id is string => typeof id === 'string' && id.trim() !== ''),
    ),
  );

  return {
    planConfig: {
      name: `Plan de ${courseName}`,
      description: `Plan generado por SofLIA para ${courseName} con ${sessions.length} sesiones`,
      userType: params.userType || 'b2c',
      courseIds: params.selectedCourseIds.map(
        (selId) => getPureCourseId(params.availableCourses.find((c) => c.id === selId)?.courseId ?? selId),
      ),
      organizationId: selectedOrganizationIds.length === 1 ? selectedOrganizationIds[0] : undefined,
      goalHoursPerWeek,
      startDate,
      endDate,
      timezone,
      preferredDays,
      preferredTimeBlocks,
      minSessionMinutes: sessionPreferences.minSessionMinutes,
      maxSessionMinutes: sessionPreferences.maxSessionMinutes,
      breakDurationMinutes: sessionPreferences.breakDurationMinutes,
      preferredSessionType: sessionPreferences.preferredSessionType,
      generationMode: 'ai_generated',
      calendarAnalyzed: params.connectedCalendar !== null,
      calendarProvider: params.connectedCalendar || undefined,
    },
    sessions,
  };
}
