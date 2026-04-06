import { HolidayService } from '../../../lib/holidays';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarEventLike,
  StudyPlannerCalendarFreeSlot,
} from '../types/planner-schedule.types';
import type { StudyApproach } from '../types/planner-ui.types';
import {
  analyzeStudyPlannerEventContext,
  calculateStudyPlannerEstimatedAvailability,
  type StudyPlannerAvailabilityEstimate,
  type StudyPlannerEventContext,
} from './planner-calendar-analysis.service';
import type { OrganizationPlannerConfig, OrganizationHoliday } from './organization-planner-config.service';

interface StudyPlannerProfileLike {
  userType?: 'b2b' | 'b2c' | null;
  professionalProfile?: {
    rol?: { nombre?: string | null } | null;
    nivel?: { nombre?: string | null } | null;
    tamanoEmpresa?: {
      nombre?: string | null;
      minEmpleados?: number | null;
      maxEmpleados?: number | null;
    } | null;
  } | null;
}

interface InternalDayAnalysis extends StudyPlannerCalendarDayAnalysis {
  heavyEvents: Array<{ event: StudyPlannerCalendarEventLike; context: StudyPlannerEventContext }>;
}

interface AnalyzeStudyPlannerSlotCalendarInput {
  calendarEvents: StudyPlannerCalendarEventLike[];
  currentTime: Date;
  effectiveApproach: StudyApproach | null;
  effectiveTargetDate?: string | null;
  organizationConfig?: OrganizationPlannerConfig | null;
  organizationHolidays?: OrganizationHoliday[];
  startDate: Date;
  targetDateObjForEvents: Date | null;
  userProfile: StudyPlannerProfileLike | null;
}

interface AnalyzeStudyPlannerSlotCalendarResult {
  avgFreeHoursPerDay: string;
  busiestDays: string[];
  calendarDataToSave: StudyPlannerCalendarDataMap;
  daysAnalysis: StudyPlannerCalendarDayAnalysis[];
  daysWithFreeTime: StudyPlannerCalendarDayAnalysis[];
  profileAvailability: StudyPlannerAvailabilityEstimate | null;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const USER_COUNTRY = 'MX';

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function isEffectivelyHoliday(date: Date): boolean {
  const isoDate = date.toISOString();
  return HolidayService.isHoliday(date, USER_COUNTRY)
    || isoDate.includes('-01-01T')
    || (date.getMonth() === 0 && date.getDate() === 1);
}

function isSameDay(dateA: Date, dateB: Date): boolean {
  return getDateKey(dateA) === getDateKey(dateB);
}

function pushFreeSlot(
  freeSlots: StudyPlannerCalendarFreeSlot[],
  start: Date,
  end: Date,
  minimumMinutes = 30,
  maximumMinutes = 360,
) {
  if (start >= end) {
    return;
  }

  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes < minimumMinutes) {
    return;
  }

  freeSlots.push({
    start: new Date(start),
    end: new Date(end),
    durationMinutes: Math.min(durationMinutes, maximumMinutes),
  });
}

function buildCompletelyFreeDaySlots(dayDate: Date, currentTime: Date): StudyPlannerCalendarFreeSlot[] {
  const freeSlots: StudyPlannerCalendarFreeSlot[] = [];
  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);
  const isToday = isSameDay(dayDate, today);

  const slotRanges = [
    { startHour: 7, endHour: 12 },
    { startHour: 12, endHour: 18 },
    { startHour: 18, endHour: 22 },
  ];

  slotRanges.forEach(({ startHour, endHour }) => {
    const slotStart = new Date(dayDate);
    slotStart.setHours(startHour, 0, 0, 0);
    const slotEnd = new Date(dayDate);
    slotEnd.setHours(endHour, 0, 0, 0);

    if (!isToday || slotStart.getTime() > currentTime.getTime()) {
      pushFreeSlot(freeSlots, slotStart, slotEnd, 30, 360);
    }
  });

  return freeSlots;
}

function buildBusyDayFreeSlots(
  dayDate: Date,
  busySlots: Array<{ start: Date; end: Date }>,
  currentTime: Date,
): StudyPlannerCalendarFreeSlot[] {
  const freeSlots: StudyPlannerCalendarFreeSlot[] = [];
  const dayStart = new Date(dayDate);
  dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(22, 0, 0, 0);
  const isToday = isSameDay(dayDate, currentTime);

  let lastEnd = new Date(dayStart);

  if (isToday && lastEnd.getTime() < currentTime.getTime()) {
    lastEnd = new Date(currentTime);
    if (lastEnd.getHours() < 7) {
      lastEnd.setHours(7, 0, 0, 0);
    }
  }

  busySlots.forEach((slot) => {
    if (slot.start > lastEnd) {
      const gapStart = new Date(Math.max(lastEnd.getTime(), dayStart.getTime()));
      const gapEnd = new Date(Math.min(slot.start.getTime(), dayEnd.getTime()));

      if (isToday && gapStart.getTime() < currentTime.getTime()) {
        gapStart.setTime(currentTime.getTime());
      }

      if (gapEnd.getHours() > 22 || (gapEnd.getHours() === 22 && gapEnd.getMinutes() > 0)) {
        gapEnd.setHours(22, 0, 0, 0);
      }

      pushFreeSlot(freeSlots, gapStart, gapEnd, 30, 480);
    }

    lastEnd = new Date(Math.max(lastEnd.getTime(), slot.end.getTime()));
  });

  if (lastEnd < dayEnd) {
    if (isToday && lastEnd.getTime() < currentTime.getTime()) {
      lastEnd = new Date(currentTime);
      if (lastEnd.getHours() < 7) {
        lastEnd.setHours(7, 0, 0, 0);
      }
    }

    const gapMinutes = Math.min((dayEnd.getTime() - lastEnd.getTime()) / (1000 * 60), 360);
    if (gapMinutes >= 30) {
      const gapEnd = new Date(lastEnd.getTime() + gapMinutes * 60 * 1000);
      pushFreeSlot(freeSlots, lastEnd, gapEnd, 30, 360);
    }
  }

  return freeSlots;
}

export function analyzeStudyPlannerSlotCalendar(
  input: AnalyzeStudyPlannerSlotCalendarInput,
): AnalyzeStudyPlannerSlotCalendarResult {
  const daySlots: Record<string, InternalDayAnalysis> = {};
  const daysToAnalyze = input.targetDateObjForEvents
    ? Math.ceil(
      (input.targetDateObjForEvents.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1
    : 30;

  for (let index = 0; index < daysToAnalyze; index += 1) {
    const date = new Date(input.startDate);
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);

    if (input.targetDateObjForEvents && date > input.targetDateObjForEvents) {
      break;
    }

    // Skip national holidays
    if (isEffectivelyHoliday(date)) {
      continue;
    }

    // Skip organizational holidays (B2B)
    if (input.organizationHolidays && input.organizationHolidays.length > 0) {
      const dateKey = getDateKey(date);
      const isOrgHoliday = input.organizationHolidays.some((h) => h.date === dateKey);
      if (isOrgHoliday) {
        continue;
      }
    }

    // Skip non-work days if org config provides work_days (B2B)
    if (input.organizationConfig?.workDays) {
      const dayOfWeek = date.getDay();
      if (!input.organizationConfig.workDays.includes(dayOfWeek)) {
        continue;
      }
    }

    const dateStr = getDateKey(date);
    daySlots[dateStr] = {
      date,
      dateStr,
      dayName: DAY_NAMES[date.getDay()],
      events: [],
      busySlots: [],
      freeSlots: [],
      totalBusyMinutes: 0,
      totalFreeMinutes: 0,
      heavyEvents: [],
      requiresRestAfter: false,
      restReason: null,
    };
  }

  [...input.calendarEvents]
    .sort((eventA, eventB) => {
      const dateA = new Date(eventA.start || eventA.startTime || 0).getTime();
      const dateB = new Date(eventB.start || eventB.startTime || 0).getTime();
      return dateA - dateB;
    })
    .forEach((event) => {
      const eventStart = new Date(event.start || event.startTime || 0);
      const eventEnd = new Date(event.end || event.endTime || 0);

      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
        return;
      }

      if (event.isAllDay) {
        const current = new Date(eventStart);
        current.setHours(0, 0, 0, 0);
        const endDay = new Date(eventEnd);
        endDay.setHours(0, 0, 0, 0);

        while (current <= endDay) {
          const dateStr = getDateKey(current);
          if (daySlots[dateStr]) {
            const dayBlockStart = new Date(current);
            dayBlockStart.setHours(0, 0, 0, 0);
            const dayBlockEnd = new Date(current);
            dayBlockEnd.setHours(23, 59, 59, 999);

            daySlots[dateStr].events.push(event);
            daySlots[dateStr].busySlots.push({ start: dayBlockStart, end: dayBlockEnd });
          }

          current.setDate(current.getDate() + 1);
        }

        return;
      }

      const dateStr = getDateKey(eventStart);
      if (!daySlots[dateStr]) {
        return;
      }

      daySlots[dateStr].events.push(event);
      daySlots[dateStr].busySlots.push({ start: eventStart, end: eventEnd });

      const eventContext = analyzeStudyPlannerEventContext(event);
      if (eventContext.requiresRestAfter) {
        daySlots[dateStr].heavyEvents.push({ event, context: eventContext });
        daySlots[dateStr].requiresRestAfter = true;
        if (!daySlots[dateStr].restReason) {
          daySlots[dateStr].restReason = eventContext.description;
        }
      }
    });

  Object.values(daySlots)
    .filter((day) => day.requiresRestAfter && day.heavyEvents.length > 0)
    .forEach((day) => {
      const nextDay = new Date(day.date);
      nextDay.setDate(nextDay.getDate() + 1);

      const nextDayKey = getDateKey(nextDay);
      if (daySlots[nextDayKey] && !daySlots[nextDayKey].requiresRestAfter) {
        daySlots[nextDayKey].requiresRestAfter = true;
        daySlots[nextDayKey].restReason = `día después de ${day.restReason || 'evento pesado'}`;
      }
    });

  const daysAnalysis = Object.values(daySlots)
    .sort((dayA, dayB) => dayA.date.getTime() - dayB.date.getTime())
    .map((day) => {
      const busySlots = [...day.busySlots].sort((slotA, slotB) => slotA.start.getTime() - slotB.start.getTime());
      const mergedBusySlots: Array<{ start: Date; end: Date }> = [];

      busySlots.forEach((slot) => {
        const previousSlot = mergedBusySlots[mergedBusySlots.length - 1];
        if (previousSlot && slot.start <= previousSlot.end) {
          previousSlot.end = new Date(Math.max(previousSlot.end.getTime(), slot.end.getTime()));
          return;
        }

        mergedBusySlots.push({ start: new Date(slot.start), end: new Date(slot.end) });
      });

      const totalBusyMinutes = mergedBusySlots.reduce((sum, slot) => {
        return sum + (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      }, 0);

      const freeSlots = mergedBusySlots.length === 0
        ? buildCompletelyFreeDaySlots(day.date, input.currentTime)
        : buildBusyDayFreeSlots(day.date, mergedBusySlots, input.currentTime);

      const totalFreeMinutes = freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);

      return {
        date: day.date,
        dateStr: day.dateStr,
        dayName: day.dayName,
        events: day.events,
        busySlots: mergedBusySlots,
        freeSlots,
        totalBusyMinutes,
        totalFreeMinutes,
        heavyEvents: day.heavyEvents,
        requiresRestAfter: day.requiresRestAfter,
        restReason: day.restReason,
      };
    });

  const calendarDataToSave = daysAnalysis.reduce<StudyPlannerCalendarDataMap>((accumulator, day) => {
    accumulator[day.dateStr] = {
      busySlots: day.busySlots.map((slot) => ({
        start: new Date(slot.start),
        end: new Date(slot.end),
      })),
      events: day.events,
    };
    return accumulator;
  }, {});

  const totalFreeMinutes = daysAnalysis.reduce((sum, day) => sum + day.totalFreeMinutes, 0);
  const avgFreeHoursPerDay = daysAnalysis.length > 0
    ? (totalFreeMinutes / 60 / daysAnalysis.length).toFixed(1)
    : '0.0';

  const daysWithFreeTime = [...daysAnalysis]
    .filter((day) => day.totalFreeMinutes >= 60)
    .sort((dayA, dayB) => dayB.totalFreeMinutes - dayA.totalFreeMinutes);

  const busiestDaysMap = new Map<string, number>();
  daysAnalysis.forEach((day) => {
    busiestDaysMap.set(day.dayName, (busiestDaysMap.get(day.dayName) || 0) + day.totalBusyMinutes);
  });

  const busiestDays = Array.from(busiestDaysMap.entries())
    .sort((dayA, dayB) => dayB[1] - dayA[1])
    .slice(0, 3)
    .map(([dayName]) => dayName);

  const profileAvailability = input.userProfile
    ? calculateStudyPlannerEstimatedAvailability({
      rol: input.userProfile.professionalProfile?.rol?.nombre || null,
      nivel: input.userProfile.professionalProfile?.nivel?.nombre || null,
      tamanoEmpresa: input.userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
      minEmpleados: input.userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
      maxEmpleados: input.userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
      userType: input.userProfile.userType || null,
      studyApproach: input.effectiveApproach,
      targetDate: input.effectiveTargetDate,
    })
    : null;

  return {
    avgFreeHoursPerDay,
    busiestDays,
    calendarDataToSave,
    daysAnalysis,
    daysWithFreeTime,
    profileAvailability,
  };
}
