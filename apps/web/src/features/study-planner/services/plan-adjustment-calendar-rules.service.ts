import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import { isWorkBlock } from './calendar-availability.service';
import type {
  StudyPlannerPlacementValidationResult,
} from './plan-adjustment.types';
import { canUseSunday, userExplicitlyAllowsSunday } from './sunday-eligibility.service';

export { validateScheduleConflict } from './plan-adjustment-conflict.service';

function toDate(value: string | Date | undefined, fallback?: Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    return new Date(value);
  }

  return fallback ? new Date(fallback) : new Date(Number.NaN);
}

function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function eventTitle(event: StudyPlannerCalendarEventLike | undefined): string {
  return event?.title || event?.summary || 'Evento programado';
}

function toCalendarEvent(event: StudyPlannerCalendarEventLike) {
  const start = event.start || event.startTime;
  const end = event.end || event.endTime;

  return {
    id: `${eventTitle(event)}-${String(start)}-${String(end)}`,
    title: eventTitle(event),
    description: event.description,
    startTime: String(start),
    endTime: String(end),
    isAllDay: Boolean(event.isAllDay),
    isRecurring: false,
    status: 'confirmed' as const,
  };
}

export function normalizeDayIdentifier(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function userExplicitlyAllowsOutsideWorkBlocks(message: string): boolean {
  const normalized = normalizeDayIdentifier(message || '');

  if (normalized.includes('domingo')) {
    return userExplicitlyAllowsSunday(message);
  }

  return [
    'sabado',
    'tiempo libre',
    'fuera del trabajo',
    'fuera de trabajo',
    'fuera del horario laboral',
    'fuera de horario laboral',
    'aunque no trabaje',
    'aunque no haya trabajo',
    'aunque sea descanso',
    'aunque sea mi descanso',
    'en mi descanso',
    'dia de descanso',
    'fin de semana',
    'aunque sea sabado',
    'usa mi sabado',
  ].some((signal) => normalized.includes(signal));
}

function toSlotDateTime(slot: StudyPlannerStoredLessonDistribution, time: string): Date {
  const [yearRaw, monthRaw, dayRaw] = slot.dateStr.split('-');
  const [hourRaw, minuteRaw] = time.split(':');

  return new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
    Number.parseInt(hourRaw, 10),
    Number.parseInt(minuteRaw, 10),
    0,
    0,
  );
}

function findOverlappingStudySession(
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
  targetSlot: StudyPlannerStoredLessonDistribution,
  proposedStartTime: Date,
  proposedEndTime: Date,
): StudyPlannerStoredLessonDistribution | undefined {
  return savedLessonDistribution.find((slot) => {
    const isSameSession =
      slot.clientReferenceId === targetSlot.clientReferenceId
      || (slot.sessionId && targetSlot.sessionId && slot.sessionId === targetSlot.sessionId);

    if (isSameSession || slot.dateStr !== targetSlot.dateStr) {
      return false;
    }

    return overlaps(
      proposedStartTime,
      proposedEndTime,
      toSlotDateTime(slot, slot.startTime),
      toSlotDateTime(slot, slot.endTime),
    );
  });
}

function hasNonWorkConflict(
  events: StudyPlannerCalendarEventLike[],
  proposedStartTime: Date,
  proposedEndTime: Date,
): StudyPlannerCalendarEventLike | undefined {
  return events.find((event) => {
    const eventStart = toDate(event.start || event.startTime);
    const eventEnd = toDate(event.end || event.endTime);

    if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
      return false;
    }

    return (
      overlaps(proposedStartTime, proposedEndTime, eventStart, eventEnd)
      && !isWorkBlock(toCalendarEvent(event))
    );
  });
}

function isInsideAnyWorkBlock(
  events: StudyPlannerCalendarEventLike[],
  proposedStartTime: Date,
  proposedEndTime: Date,
): boolean {
  return events.filter((event) => isWorkBlock(toCalendarEvent(event))).some((event) => {
    const workStart = toDate(event.start || event.startTime);
    const workEnd = toDate(event.end || event.endTime);

    if (Number.isNaN(workStart.getTime()) || Number.isNaN(workEnd.getTime())) {
      return false;
    }

    return proposedStartTime >= workStart && proposedEndTime <= workEnd;
  });
}

export function validateSchedulePlacementRules(params: {
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  targetSlot: StudyPlannerStoredLessonDistribution;
  userMessage?: string;
}): StudyPlannerPlacementValidationResult {
  const { savedCalendarData, savedLessonDistribution, targetSlot, userMessage } = params;
  const proposedStartTime = toSlotDateTime(targetSlot, targetSlot.startTime);
  const proposedEndTime = toSlotDateTime(targetSlot, targetSlot.endTime);

  if (proposedEndTime <= proposedStartTime) {
    return {
      valid: false,
      message: 'La hora de fin debe ser posterior a la hora de inicio.',
    };
  }

  const overlappingStudySession = findOverlappingStudySession(
    savedLessonDistribution,
    targetSlot,
    proposedStartTime,
    proposedEndTime,
  );

  if (overlappingStudySession) {
    const lessonLabel = overlappingStudySession.lessons[0]?.lessonTitle || 'otra sesion de estudio';
    return {
      valid: false,
      message: `Ese cambio duplicaria o se traslaparia con "${lessonLabel}".`,
    };
  }

  const dayData = savedCalendarData?.[targetSlot.dateStr];
  if (!canUseSunday({
    date: proposedStartTime,
    events: dayData?.events || [],
    userMessage,
  })) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones en domingo si tienes un bloque de trabajo ese dia o si me indicas explicitamente que quieres estudiar en domingo.',
    };
  }

  if (!dayData) {
    return { valid: true };
  }

  const overlappingNonWorkEvent = hasNonWorkConflict(
    dayData.events,
    proposedStartTime,
    proposedEndTime,
  );

  if (overlappingNonWorkEvent) {
    return {
      valid: false,
      message: `No puedo colocar una sesion sobre "${eventTitle(overlappingNonWorkEvent)}" porque no es un bloque de trabajo.`,
      conflictingEvent: overlappingNonWorkEvent,
    };
  }

  if (userExplicitlyAllowsOutsideWorkBlocks(userMessage || '')) {
    return { valid: true };
  }

  if (!isInsideAnyWorkBlock(dayData.events, proposedStartTime, proposedEndTime)) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones dentro de bloques de trabajo. Si quieres usar tiempo libre o un dia de descanso, indicalo explicitamente.',
    };
  }

  return { valid: true };
}
