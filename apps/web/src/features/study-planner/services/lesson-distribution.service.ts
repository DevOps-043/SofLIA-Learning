import type {
  StudyPlannerComputedLessonDistribution,
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import {
  formatPlannerTime24h,
  getPlannerDayName,
  normalizeComparableText,
  parsePlannerDateString,
  sortLessonDistributions,
} from './lesson-distribution-date.service';

export {
  filterHolidayLessonDistributions,
  formatPlannerTime24h,
  isHolidayDistributionDate,
  parsePlannerDateString,
  parsePlannerTimeString,
  sortLessonDistributions,
} from './lesson-distribution-date.service';

function getDistributionKey(item: Pick<StudyPlannerStoredLessonDistribution, 'dateStr' | 'startTime'>): string {
  return `${item.dateStr}_${item.startTime}`;
}

function generateDistributionReferenceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isInformativeLessonTitle(title: string): boolean {
  const normalized = normalizeComparableText(title);
  if (!normalized || normalized.length <= 3) {
    return false;
  }

  return !/^leccion\s*\d+(?:\.\d+)?[:.\-]?\s*$/.test(normalized) && normalized !== 'sin lecciones asignadas';
}

function sanitizeScheduledLesson(
  lesson: Partial<StudyPlannerScheduledLesson> | null | undefined
): StudyPlannerScheduledLesson | null {
  if (!lesson?.lessonTitle || typeof lesson.lessonTitle !== 'string') {
    return null;
  }

  const lessonTitle = lesson.lessonTitle.trim();
  if (!isInformativeLessonTitle(lessonTitle)) {
    return null;
  }

  return {
    courseTitle: lesson.courseTitle?.trim() || 'Curso',
    lessonTitle,
    lessonOrderIndex: typeof lesson.lessonOrderIndex === 'number' && lesson.lessonOrderIndex > 0
      ? lesson.lessonOrderIndex
      : 0,
    durationMinutes: typeof lesson.durationMinutes === 'number' && lesson.durationMinutes >= 0
      ? lesson.durationMinutes
      : 0,
    moduleTitle: lesson.moduleTitle?.trim() || undefined,
    moduleOrderIndex: typeof lesson.moduleOrderIndex === 'number'
      ? lesson.moduleOrderIndex
      : undefined,
  };
}

function chooseLessonsToKeep(
  existing: StudyPlannerStoredLessonDistribution | undefined,
  incoming: StudyPlannerStoredLessonDistribution
): StudyPlannerScheduledLesson[] {
  if (existing?.lessons.length) {
    return existing.lessons;
  }

  return incoming.lessons;
}

export function ensureLessonDistributionIdentity(
  distribution: Omit<StudyPlannerStoredLessonDistribution, 'clientReferenceId'> & {
    clientReferenceId?: string;
    sessionId?: string;
  },
): StudyPlannerStoredLessonDistribution {
  return {
    ...distribution,
    clientReferenceId: distribution.clientReferenceId?.trim() || generateDistributionReferenceId(),
    sessionId: distribution.sessionId?.trim() || undefined,
  };
}

export function serializeLessonDistributionForStorage(
  lessonDistribution: StudyPlannerComputedLessonDistribution[]
): StudyPlannerStoredLessonDistribution[] {
  return lessonDistribution
    .map(item => {
      const lessons = item.lessons
        .map(sanitizeScheduledLesson)
        .filter((lesson): lesson is StudyPlannerScheduledLesson => lesson !== null);

      if (lessons.length === 0) {
        return null;
      }

      const parsedDate = parsePlannerDateString(item.slot.dateStr);
      const dayName = item.slot.dayName || (parsedDate ? getPlannerDayName(parsedDate) : 'Lunes');

      const sumDuration = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
      const totalMinutes = sumDuration > 0 ? sumDuration : lessons.length * 15;
      const actualEnd = new Date(item.slot.start.getTime() + totalMinutes * 60000);
      const finalEnd = actualEnd.getTime() > item.slot.end.getTime() ? item.slot.end : actualEnd;

      return {
        clientReferenceId: generateDistributionReferenceId(),
        dateStr: item.slot.dateStr,
        dayName,
        startTime: formatPlannerTime24h(item.slot.start),
        endTime: formatPlannerTime24h(finalEnd),
        lessons,
      };
    })
    .filter((item): item is StudyPlannerStoredLessonDistribution => item !== null);
}

export function mergeLessonDistributions(
  existing: StudyPlannerStoredLessonDistribution[],
  incoming: StudyPlannerStoredLessonDistribution[],
  options?: { replaceExisting?: boolean }
): StudyPlannerStoredLessonDistribution[] {
  const existingMap = new Map(existing.map(item => [getDistributionKey(item), item]));
  const incomingMap = new Map(incoming.map(item => [getDistributionKey(item), item]));

  if (options?.replaceExisting) {
    return sortLessonDistributions(
      incoming.map(item => {
        const current = existingMap.get(getDistributionKey(item));
        return ensureLessonDistributionIdentity({
          ...item,
          clientReferenceId: current?.clientReferenceId || item.clientReferenceId,
          sessionId: current?.sessionId || item.sessionId,
          lessons: chooseLessonsToKeep(current, item),
        });
      })
    );
  }

  const merged = [...existing];

  incoming.forEach(item => {
    const key = getDistributionKey(item);
    const index = merged.findIndex(current => getDistributionKey(current) === key);
    const current = existingMap.get(key);
    const nextItem = ensureLessonDistributionIdentity({
      ...item,
      clientReferenceId: current?.clientReferenceId || item.clientReferenceId,
      sessionId: current?.sessionId || item.sessionId,
      lessons: chooseLessonsToKeep(current, item),
    });

    if (index >= 0) {
      merged[index] = nextItem;
      return;
    }

    if (!incomingMap.has(key)) {
      return;
    }

    merged.push(nextItem);
  });

  return sortLessonDistributions(merged);
}

export function shouldReplaceLessonDistribution(params: {
  liaResponse: string;
  extractedSchedulesCount: number;
  existingSchedulesCount: number;
  isAddingSchedules: boolean;
  isConfirmingSchedules: boolean;
}): boolean {
  const lowerResponse = params.liaResponse.toLowerCase();
  const looksLikeSummary =
    lowerResponse.includes('resumen') ||
    lowerResponse.includes('distribucion') ||
    lowerResponse.includes('todos los horarios') ||
    lowerResponse.includes('horarios:') ||
    lowerResponse.includes('sesiones programadas') ||
    lowerResponse.includes('plan de estudios') ||
    lowerResponse.includes('sesiones generadas') ||
    lowerResponse.includes('ajustar') ||
    lowerResponse.includes('ajuste') ||
    lowerResponse.includes('plan actualizado') ||
    (params.extractedSchedulesCount >= 5 && params.existingSchedulesCount > 0);

  return looksLikeSummary || params.isAddingSchedules || params.isConfirmingSchedules;
}
