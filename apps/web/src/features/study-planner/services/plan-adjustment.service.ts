import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

export interface StudyPlannerScheduleConflictResult {
  hasConflict: boolean;
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
    targetMatch = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(targetDate.getDate()).padStart(2, '0')}`;
  } else if (targetDayWord) {
    const targetDayNum = dayNames[targetDayWord] ?? -1;

    if (targetDayNum >= 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const candidate = new Date(today);
      for (let index = 0; index < 14; index += 1) {
        if (candidate.getDay() === targetDayNum && candidate >= today) {
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
