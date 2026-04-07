import type {
  StudyApproach,
  StudyPlannerCourseOption,
} from '../types/planner-ui.types';
import type {
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import {
  parsePlannerDateString,
  parsePlannerTimeString,
} from './lesson-distribution.service';

type StudyPlannerSessionType = 'short' | 'medium' | 'long';

export interface StudyPlanPreferredTimeBlock {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface StudyPlanSessionPayload {
  title: string;
  description: string;
  courseId: string;
  lessonId: undefined;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAiGenerated: true;
  sessionType: StudyPlannerSessionType;
}

export interface StudyPlanConfigPayload {
  name: string;
  description: string;
  userType: 'b2b' | 'b2c';
  courseIds: string[];
  goalHoursPerWeek: number;
  startDate: string;
  endDate?: string;
  timezone: string;
  preferredDays: number[];
  preferredTimeBlocks: StudyPlanPreferredTimeBlock[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredSessionType: StudyPlannerSessionType;
  generationMode: 'ai_generated';
  calendarAnalyzed: boolean;
  calendarProvider?: 'google' | 'microsoft';
}

export interface StudyPlanSavePayload {
  planConfig: StudyPlanConfigPayload;
  sessions: StudyPlanSessionPayload[];
}

export interface BuildStudyPlanPayloadParams {
  availableCourses: StudyPlannerCourseOption[];
  connectedCalendar: 'google' | 'microsoft' | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedTargetDate: string | null;
  selectedCourseIds: string[];
  studyApproach: StudyApproach | null;
  userType: 'b2b' | null | undefined;
}

export interface SaveStudyPlanApiData {
  planId?: string;
  sessionIds?: string[];
}

export interface SyncStudyPlanSessionsResult {
  success: boolean;
  insertedCount: number;
  requiresReconnection: boolean;
}

function calculateGoalHoursPerWeek(
  distribution: StudyPlannerStoredLessonDistribution[],
): number {
  const totalMinutes = distribution.reduce((acc, slot) => {
    const startMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
    const endMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);

    if (!startMatch || !endMatch) {
      return acc;
    }

    const startTotal = Number.parseInt(startMatch[1], 10) * 60
      + Number.parseInt(startMatch[2], 10);
    const endTotal = Number.parseInt(endMatch[1], 10) * 60
      + Number.parseInt(endMatch[2], 10);
    const duration = endTotal - startTotal;

    return acc + (duration > 0 ? duration : 0);
  }, 0);

  if (distribution.length === 0 || totalMinutes <= 0) {
    return 5;
  }

  const dates = distribution
    .map((slot) => parsePlannerDateString(slot.dateStr))
    .filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime())));

  if (dates.length === 0) {
    return 5;
  }

  const minDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())));
  const daysDiff = Math.max(
    1,
    Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const weeks = Math.max(1, daysDiff / 7);
  const goalHoursPerWeek = Math.round((totalMinutes / 60 / weeks) * 10) / 10;

  return goalHoursPerWeek < 1 ? 5 : goalHoursPerWeek;
}

function extractPreferredDays(
  distribution: StudyPlannerStoredLessonDistribution[],
): number[] {
  const preferredDays = new Set<number>();

  distribution.forEach((slot) => {
    const date = parsePlannerDateString(slot.dateStr);
    if (date && !Number.isNaN(date.getTime())) {
      preferredDays.add(date.getDay());
    }
  });

  const sortedDays = Array.from(preferredDays).sort((left, right) => left - right);
  return sortedDays.length > 0 ? sortedDays : [1, 2, 3, 4, 5];
}

function extractPreferredTimeBlocks(
  distribution: StudyPlannerStoredLessonDistribution[],
): StudyPlanPreferredTimeBlock[] {
  const timeBlocks = new Map<string, StudyPlanPreferredTimeBlock>();

  distribution.forEach((slot) => {
    const startTime = parsePlannerTimeString(slot.startTime);
    const endTime = parsePlannerTimeString(slot.endTime);

    if (!startTime || !endTime) {
      return;
    }

    const key = [
      startTime.hours,
      startTime.minutes,
      endTime.hours,
      endTime.minutes,
    ].join(':');

    if (!timeBlocks.has(key)) {
      timeBlocks.set(key, {
        startHour: startTime.hours,
        startMinute: startTime.minutes,
        endHour: endTime.hours,
        endMinute: endTime.minutes,
      });
    }
  });

  const preferredTimeBlocks = Array.from(timeBlocks.values());
  return preferredTimeBlocks.length > 0
    ? preferredTimeBlocks
    : [{ startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 }];
}

function resolveSessionPreferences(studyApproach: StudyApproach | null) {
  if (studyApproach === 'corto') {
    return {
      preferredSessionType: 'long' as const,
      minSessionMinutes: 60,
      maxSessionMinutes: 90,
      breakDurationMinutes: 15,
    };
  }

  if (studyApproach === 'largo') {
    return {
      preferredSessionType: 'short' as const,
      minSessionMinutes: 20,
      maxSessionMinutes: 35,
      breakDurationMinutes: 5,
    };
  }

  return {
    preferredSessionType: 'medium' as const,
    minSessionMinutes: 45,
    maxSessionMinutes: 60,
    breakDurationMinutes: 10,
  };
}

function buildSessionTitle(lessons: StudyPlannerScheduledLesson[]): string {
  const validLessons = lessons.filter(
    (lesson) => lesson.lessonTitle && lesson.lessonTitle.trim() !== '',
  );

  if (validLessons.length === 0) {
    return 'Sesion de estudio';
  }

  if (validLessons.length === 1) {
    return validLessons[0].lessonTitle
      .trim()
      .replace(
        /^(?:curso|leccion|tema|modulo|clase|sesion|capitulo|taller)\s*[^:]*:\s*/i,
        '',
      ) || 'Sesion de estudio';
  }

  if (validLessons.length === 2) {
    const combinedTitle = `${validLessons[0].lessonTitle.trim()} y ${validLessons[1].lessonTitle.trim()}`;
    return combinedTitle.length > 100
      ? `${validLessons[0].lessonTitle.trim().slice(0, 50)}... y ${validLessons[1].lessonTitle.trim().slice(0, 40)}...`
      : combinedTitle;
  }

  const firstTitle = validLessons[0].lessonTitle.trim();
  return firstTitle.length > 60
    ? `${firstTitle.slice(0, 60)}... y ${validLessons.length - 1} mas`
    : `${firstTitle} y ${validLessons.length - 1} mas`;
}

function buildSessionDescription(lessons: StudyPlannerScheduledLesson[]): string {
  const description = lessons
    .filter((lesson) => lesson.lessonTitle && lesson.lessonTitle.trim() !== '')
    .map((lesson, index) => `${index + 1}. ${lesson.lessonTitle.trim()}`)
    .join('\n');

  return description || 'Sesion de estudio programada';
}

export function buildStudyPlanPayload(
  params: BuildStudyPlanPayloadParams,
): StudyPlanSavePayload {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const goalHoursPerWeek = calculateGoalHoursPerWeek(params.savedLessonDistribution);
  const preferredDays = extractPreferredDays(params.savedLessonDistribution);
  const preferredTimeBlocks = extractPreferredTimeBlocks(params.savedLessonDistribution);
  const sessionPreferences = resolveSessionPreferences(params.studyApproach);

  const firstSlotDate = params.savedLessonDistribution[0]
    ? parsePlannerDateString(params.savedLessonDistribution[0].dateStr)
    : null;
  const startDate = firstSlotDate && !Number.isNaN(firstSlotDate.getTime())
    ? firstSlotDate.toISOString()
    : new Date().toISOString();

  const lastSlotDate = params.savedLessonDistribution.length > 0
    ? parsePlannerDateString(
      params.savedLessonDistribution[params.savedLessonDistribution.length - 1].dateStr,
    )
    : null;
  const parsedTargetDate = params.savedTargetDate ? parsePlannerDateString(params.savedTargetDate) : null;
  const validTargetDate = parsedTargetDate && !Number.isNaN(parsedTargetDate.getTime()) ? parsedTargetDate : null;

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

    if (endTime <= startTime) {
      endTime.setTime(startTime.getTime() + 60 * 60 * 1000);
    }

    const firstLesson = slot.lessons[0];
    const courseTitle = firstLesson?.courseTitle ?? 'Curso';
    const course = params.availableCourses.find(
      (availableCourse) =>
        availableCourse.title === courseTitle
        || params.selectedCourseIds.includes(availableCourse.id),
    );

    // Use the actual course UUID (courseId), not the selection key (id).
    const resolvedCourseId =
      course?.courseId
      ?? params.availableCourses.find((c) => params.selectedCourseIds.includes(c.id))?.courseId
      ?? params.selectedCourseIds[0]
      ?? '';

    return {
      title: buildSessionTitle(slot.lessons),
      description: buildSessionDescription(slot.lessons),
      courseId: resolvedCourseId,
      lessonId: undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
      isAiGenerated: true as const,
      sessionType: sessionPreferences.preferredSessionType,
    };
  });

  if (sessions.length === 0) {
    throw new Error('No hay sesiones para guardar');
  }

  if (preferredDays.length === 0) {
    throw new Error('No se pudieron determinar los dias preferidos');
  }

  return {
    planConfig: {
      name: `Plan de Estudios - ${new Date().toLocaleDateString('es-ES')}`,
      description: `Plan generado por SofLIA con ${sessions.length} sesiones${params.selectedCourseIds.length > 0 ? ` para ${params.selectedCourseIds.length} curso(s)` : ''}`,
      userType: params.userType || 'b2c',
      courseIds: params.selectedCourseIds.map(
        (selId) => params.availableCourses.find((c) => c.id === selId)?.courseId ?? selId,
      ),
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

export async function cleanupPreviousPlanEvents(planId: string): Promise<void> {
  await fetch('/api/study-planner/calendar/delete-plan-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
}

export async function saveStudyPlanRequest(
  payload: StudyPlanSavePayload,
): Promise<SaveStudyPlanApiData> {
  const response = await fetch('/api/study-planner/save-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: payload.planConfig,
      sessions: payload.sessions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;

    try {
      const errorData = errorText ? JSON.parse(errorText) as Record<string, unknown> : {};
      const error =
        typeof errorData.error === 'string' && errorData.error.trim() !== ''
          ? errorData.error
          : typeof errorData.message === 'string' && errorData.message.trim() !== ''
            ? errorData.message
            : null;

      if (error) {
        errorMessage = error;
      }
    } catch {
      if (errorText.trim() !== '') {
        errorMessage = `Error ${response.status}: ${errorText.slice(0, 200)}`;
      }
    }

    throw new Error(errorMessage);
  }

  const responseData = await response.json() as {
    success?: boolean;
    error?: string;
    data?: SaveStudyPlanApiData;
  };

  if (!responseData.success) {
    throw new Error(responseData.error || 'Error al guardar el plan');
  }

  return responseData.data || {};
}

export async function syncStudyPlanSessions(
  sessionIds: string[],
): Promise<SyncStudyPlanSessionsResult> {
  if (sessionIds.length === 0) {
    return { success: false, insertedCount: 0, requiresReconnection: false };
  }

  const response = await fetch('/api/study-planner/calendar/sync-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionIds }),
  });

  const result = await response.json() as {
    success?: boolean;
    error?: string;
    data?: { syncedCount?: number };
  };

  return {
    success: Boolean(response.ok && result.success),
    insertedCount: result.data?.syncedCount || 0,
    requiresReconnection: response.status === 401,
  };
}

export function buildStudyPlanSuccessMessage(params: {
  connectedCalendar: 'google' | 'microsoft' | null;
  insertedCount: number;
  sessionsCount: number;
  syncSuccess: boolean;
}): string {
  let calendarMessage = '';

  if (params.connectedCalendar && params.syncSuccess && params.insertedCount > 0) {
    calendarMessage = ` He insertado ${params.insertedCount} eventos en tu calendario de Google (en "SofLIA - Sesiones de Estudio").`;
  } else if (params.connectedCalendar) {
    calendarMessage = ' Las sesiones han sido sincronizadas con tu calendario.';
  }

  return `Perfecto! He guardado tu plan de estudios con ${params.sessionsCount} sesiones programadas.${calendarMessage}\n\nPuedes ver tu plan en la seccion de "Mis Planes" y comenzar a estudiar cuando lo desees.`;
}
