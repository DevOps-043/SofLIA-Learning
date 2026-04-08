import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import { isWorkBlock } from './calendar-availability.service';

export interface StudyPlannerScheduleConflictResult {
  hasConflict: boolean;
  conflictingEvent?:
    | StudyPlannerCalendarEventLike
    | { start: Date; end: Date; title?: string; summary?: string };
}

export interface StudyPlannerPlacementValidationResult {
  valid: boolean;
  message?: string;
  conflictingEvent?:
    | StudyPlannerCalendarEventLike
    | { start: Date; end: Date; title?: string; summary?: string };
}

export interface StudyPlannerTimeChangeRequest {
  oldHour?: number;
  newHour?: number;
  dates?: string[];
}

export interface StudyPlannerDateChangeRequest {
  sourceDate: string;
  targetDate: string;
  sourceDayName: string;
  targetDayName: string;
}

function normalizeDayIdentifier(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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

export function userExplicitlyAllowsOutsideWorkBlocks(message: string): boolean {
  const normalized = normalizeDayIdentifier(message || '');

  return [
    'domingo',
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
    'aunque sea domingo',
    'aunque sea sabado',
    'puedes usar mi domingo',
    'usa mi domingo',
    'usa mi sabado',
  ].some((signal) => normalized.includes(signal));
}

export function validateSchedulePlacementRules(params: {
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  targetSlot: StudyPlannerStoredLessonDistribution;
  userMessage?: string;
}): StudyPlannerPlacementValidationResult {
  const { savedCalendarData, savedLessonDistribution, targetSlot, userMessage } = params;
  const [yearRaw, monthRaw, dayRaw] = targetSlot.dateStr.split('-');
  const proposedStartTime = new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
    Number.parseInt(targetSlot.startTime.split(':')[0], 10),
    Number.parseInt(targetSlot.startTime.split(':')[1], 10),
    0,
    0,
  );
  const proposedEndTime = new Date(
    Number.parseInt(yearRaw, 10),
    Number.parseInt(monthRaw, 10) - 1,
    Number.parseInt(dayRaw, 10),
    Number.parseInt(targetSlot.endTime.split(':')[0], 10),
    Number.parseInt(targetSlot.endTime.split(':')[1], 10),
    0,
    0,
  );

  if (proposedEndTime <= proposedStartTime) {
    return {
      valid: false,
      message: 'La hora de fin debe ser posterior a la hora de inicio.',
    };
  }

  const overlappingStudySession = savedLessonDistribution.find((slot) => {
    if (
      slot.clientReferenceId === targetSlot.clientReferenceId
      || (slot.sessionId && targetSlot.sessionId && slot.sessionId === targetSlot.sessionId)
    ) {
      return false;
    }

    if (slot.dateStr !== targetSlot.dateStr) {
      return false;
    }

    const [slotStartHour, slotStartMinute] = slot.startTime.split(':').map(Number);
    const [slotEndHour, slotEndMinute] = slot.endTime.split(':').map(Number);
    const slotStart = new Date(
      Number.parseInt(yearRaw, 10),
      Number.parseInt(monthRaw, 10) - 1,
      Number.parseInt(dayRaw, 10),
      slotStartHour,
      slotStartMinute,
      0,
      0,
    );
    const slotEnd = new Date(
      Number.parseInt(yearRaw, 10),
      Number.parseInt(monthRaw, 10) - 1,
      Number.parseInt(dayRaw, 10),
      slotEndHour,
      slotEndMinute,
      0,
      0,
    );

    return overlaps(proposedStartTime, proposedEndTime, slotStart, slotEnd);
  });

  if (overlappingStudySession) {
    const lessonLabel = overlappingStudySession.lessons[0]?.lessonTitle || 'otra sesion de estudio';
    return {
      valid: false,
      message: `Ese cambio duplicaria o se traslaparia con "${lessonLabel}".`,
    };
  }

  const dayData = savedCalendarData?.[targetSlot.dateStr];
  if (!dayData) {
    return { valid: true };
  }

  const overlappingNonWorkEvent = dayData.events.find((event) => {
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

  const workBlocks = dayData.events.filter((event) => isWorkBlock(toCalendarEvent(event)));
  const isInsideWorkBlock = workBlocks.some((event) => {
    const workStart = toDate(event.start || event.startTime);
    const workEnd = toDate(event.end || event.endTime);

    if (Number.isNaN(workStart.getTime()) || Number.isNaN(workEnd.getTime())) {
      return false;
    }

    return proposedStartTime >= workStart && proposedEndTime <= workEnd;
  });

  if (!isInsideWorkBlock) {
    return {
      valid: false,
      message: 'Solo puedo programar sesiones dentro de bloques de trabajo. Si quieres usar tiempo libre o un dia de descanso, indicalo explicitamente.',
    };
  }

  return { valid: true };
}

export function validateScheduleConflict(
  savedCalendarData: StudyPlannerCalendarDataMap | null,
  date: Date,
  startTime: Date,
  endTime: Date,
): StudyPlannerScheduleConflictResult {
  if (!savedCalendarData) {
    return { hasConflict: false };
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const dayData = savedCalendarData[dateStr];

  if (!dayData || !dayData.busySlots || dayData.busySlots.length === 0) {
    return { hasConflict: false };
  }

  for (const busySlot of dayData.busySlots) {
    const busyStart = new Date(busySlot.start);
    const busyEnd = new Date(busySlot.end);

    if (
      (startTime >= busyStart && startTime < busyEnd)
      || (endTime > busyStart && endTime <= busyEnd)
      || (startTime <= busyStart && endTime >= busyEnd)
    ) {
      const conflictingEvent = dayData.events.find((event) => {
        const eventStart = new Date(event.start || event.startTime || busyStart);
        return eventStart.getTime() === busyStart.getTime();
      });

      return {
        hasConflict: true,
        conflictingEvent: conflictingEvent || { start: busyStart, end: busyEnd },
      };
    }
  }

  return { hasConflict: false };
}

export function extractTimeChangeRequest(
  message: string,
): StudyPlannerTimeChangeRequest | null {
  const timeChangePattern =
    /(?:cambiar|ajustar|modificar|poner|mover|cambiame).*?(?:las\s+)?(?:horas?\s+que\s+)?(?:iniciar|empiezan|comienzan|empiecen|comiencen)\s*(?:a\s+las?|a)?\s*(\d{1,2}).*?(?:por|a|por las|a las)\s*(\d{1,2})/i;
  const match = message.match(timeChangePattern);

  if (match) {
    const oldHour = Number.parseInt(match[1], 10);
    const newHour = Number.parseInt(match[2], 10);

    if (oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23) {
      return { oldHour, newHour };
    }
  }

  const dayOfWeekPattern =
    /(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})/i;
  if (dayOfWeekPattern.test(message)) {
    return null;
  }

  const simplePattern = /(?:^|\s)(?:de\s+)?(\d{1,2})\s+(?:por|a)\s+(?:las?\s+)?(\d{1,2})(?:\s|$)/i;
  const simpleMatch = message.match(simplePattern);

  if (!simpleMatch) {
    return null;
  }

  const oldHour = Number.parseInt(simpleMatch[1], 10);
  const newHour = Number.parseInt(simpleMatch[2], 10);

  return oldHour >= 0 && oldHour <= 23 && newHour >= 0 && newHour <= 23
    ? { oldHour, newHour }
    : null;
}

export function extractDateChangeRequest(
  message: string,
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
): StudyPlannerDateChangeRequest | null {
  const dayNames: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };
  const dayNamesArr = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miercoles',
    'Jueves',
    'Viernes',
    'Sabado',
  ];

  const dayPattern =
    /(?:del?|desde)\s+(?:(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+)?(\d{1,2})?\s+(?:al?|hacia|para el|al?)\s+(?:(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+)?(\d{1,2})?/i;
  const match = message.match(dayPattern);

  if (!match) {
    return null;
  }

  const sourceDayWord = match[1] ? normalizeDayIdentifier(match[1]) : undefined;
  const sourceNum = match[2] ? Number.parseInt(match[2], 10) : undefined;
  const targetDayWord = match[3] ? normalizeDayIdentifier(match[3]) : undefined;
  const targetNum = match[4] ? Number.parseInt(match[4], 10) : undefined;

  if ((!sourceDayWord && !sourceNum) || (!targetDayWord && !targetNum)) {
    return null;
  }

  let sourceMatch: string | null = null;

  for (const slot of savedLessonDistribution) {
    const parts = slot.dateStr.split('-');
    const slotDate = new Date(
      Number.parseInt(parts[0], 10),
      Number.parseInt(parts[1], 10) - 1,
      Number.parseInt(parts[2], 10),
    );
    const dayOfMonth = slotDate.getDate();
    const dayOfWeek = normalizeDayIdentifier(slot.dayName || '');

    if (sourceNum && dayOfMonth === sourceNum) {
      sourceMatch = slot.dateStr;
      break;
    }

    if (sourceDayWord && dayOfWeek === sourceDayWord) {
      sourceMatch = slot.dateStr;
      if (!sourceNum) {
        break;
      }
    }
  }

  if (!sourceMatch) {
    return null;
  }

  const sourceParts = sourceMatch.split('-');
  const sourceDate = new Date(
    Number.parseInt(sourceParts[0], 10),
    Number.parseInt(sourceParts[1], 10) - 1,
    Number.parseInt(sourceParts[2], 10),
  );

  let targetMatch: string | null = null;

  if (targetNum) {
    const targetDate = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), targetNum);
    if (targetDate < sourceDate) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    targetMatch = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  } else if (targetDayWord) {
    const targetDayNum = dayNames[targetDayWord] ?? -1;

    if (targetDayNum >= 0) {
      const candidate = new Date(sourceDate);
      candidate.setHours(0, 0, 0, 0);
      for (let index = 0; index < 14; index += 1) {
        if (candidate.getDay() === targetDayNum && candidate.getTime() !== sourceDate.getTime()) {
          targetMatch = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(
            2,
            '0',
          )}-${String(candidate.getDate()).padStart(2, '0')}`;
          break;
        }

        candidate.setDate(candidate.getDate() + 1);
      }
    }
  }

  if (!targetMatch) {
    return null;
  }

  const targetParts = targetMatch.split('-');
  const targetDateObj = new Date(
    Number.parseInt(targetParts[0], 10),
    Number.parseInt(targetParts[1], 10) - 1,
    Number.parseInt(targetParts[2], 10),
  );

  return {
    sourceDate: sourceMatch,
    targetDate: targetMatch,
    sourceDayName: dayNamesArr[sourceDate.getDay()],
    targetDayName: dayNamesArr[targetDateObj.getDay()],
  };
}
