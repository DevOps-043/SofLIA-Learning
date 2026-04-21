import { HolidayService } from '../../../lib/holidays';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarEventLike,
} from '../types/planner-schedule.types';
import type { StudyApproach } from '../types/planner-ui.types';
import {
  analyzeStudyPlannerEventContext,
  calculateStudyPlannerEstimatedAvailability,
  type StudyPlannerAvailabilityEstimate,
  type StudyPlannerEventContext,
} from './planner-calendar-analysis.service';
import type { OrganizationPlannerConfig, OrganizationHoliday } from './organization-planner-config.service';
import { buildCompletelyFreeDaySlots, buildBusyDayFreeSlots, buildWorkBlockFreeSlots } from './planner-slot-free-time.service';

const WORK_BLOCK_TITLE_PATTERN = /(trabajo|work|oficina|jornada|laboral|shift|turno|servi[çc]o|expediente)/i;
const WORK_BLOCK_EXCLUDE_PATTERN = /(junta|reuni[oó]n|reuni[aã]o|meeting|llamada|chamada|profundo|deep[\s\-]?work|focus[\s\-]?time|concentraci[oó]n)/i;
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const USER_COUNTRY = 'MX';

function isWorkBlock(event: StudyPlannerCalendarEventLike): boolean {
  if ('status' in event && event.status === 'cancelled') return false;
  const durationMinutes = (new Date(event.end || event.endTime || 0).getTime() - new Date(event.start || event.startTime || 0).getTime()) / 60000;
  if (durationMinutes < 180) return false;
  const title = event.summary || event.title || '';
  if (WORK_BLOCK_EXCLUDE_PATTERN.test(title)) return false;
  return WORK_BLOCK_TITLE_PATTERN.test(title);
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isEffectivelyHoliday(date: Date): boolean {
  const isoDate = date.toISOString();
  return HolidayService.isHoliday(date, USER_COUNTRY) || isoDate.includes('-01-01T') || (date.getMonth() === 0 && date.getDate() === 1);
}

interface StudyPlannerProfileLike {
  userType?: 'b2b' | 'b2c' | null;
  professionalProfile?: {
    rol?: { nombre?: string | null } | null;
    nivel?: { nombre?: string | null } | null;
    tamanoEmpresa?: { nombre?: string | null; minEmpleados?: number | null; maxEmpleados?: number | null } | null;
  } | null;
}

interface InternalDayAnalysis extends StudyPlannerCalendarDayAnalysis {
  heavyEvents: Array<{ event: StudyPlannerCalendarEventLike; context: StudyPlannerEventContext }>;
  workBlockEvents: StudyPlannerCalendarEventLike[];
}

export interface AnalyzeStudyPlannerSlotCalendarInput {
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

export interface AnalyzeStudyPlannerSlotCalendarResult {
  avgFreeHoursPerDay: string;
  busiestDays: string[];
  calendarDataToSave: StudyPlannerCalendarDataMap;
  daysAnalysis: StudyPlannerCalendarDayAnalysis[];
  daysWithFreeTime: StudyPlannerCalendarDayAnalysis[];
  profileAvailability: StudyPlannerAvailabilityEstimate | null;
}

export function analyzeStudyPlannerSlotCalendar(
  input: AnalyzeStudyPlannerSlotCalendarInput,
): AnalyzeStudyPlannerSlotCalendarResult {
  const daySlots: Record<string, InternalDayAnalysis> = {};
  const daysToAnalyze = input.targetDateObjForEvents
    ? Math.ceil((input.targetDateObjForEvents.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 30;

  for (let i = 0; i < daysToAnalyze; i++) {
    const date = new Date(input.startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    if (input.targetDateObjForEvents && date > input.targetDateObjForEvents) break;
    if (isEffectivelyHoliday(date)) continue;
    const dateKey = getDateKey(date);
    if (input.organizationHolidays?.some((h) => h.date === dateKey)) continue;
    if (input.organizationConfig?.workDays && !input.organizationConfig.workDays.includes(date.getDay())) continue;
    daySlots[dateKey] = { date, dateStr: dateKey, dayName: DAY_NAMES[date.getDay()], events: [], busySlots: [], workBlockEvents: [], freeSlots: [], totalBusyMinutes: 0, totalFreeMinutes: 0, heavyEvents: [], requiresRestAfter: false, restReason: null };
  }

  [...input.calendarEvents]
    .sort((a, b) => new Date(a.start || a.startTime || 0).getTime() - new Date(b.start || b.startTime || 0).getTime())
    .forEach((event) => {
      const eventStart = new Date(event.start || event.startTime || 0);
      const eventEnd = new Date(event.end || event.endTime || 0);
      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) return;

      if (event.isAllDay) {
        const current = new Date(eventStart); current.setHours(0, 0, 0, 0);
        const endDay = new Date(eventEnd); endDay.setHours(0, 0, 0, 0);
        while (current <= endDay) {
          const dateStr = getDateKey(current);
          if (daySlots[dateStr]) {
            const s = new Date(current); s.setHours(0, 0, 0, 0);
            const e = new Date(current); e.setHours(23, 59, 59, 999);
            daySlots[dateStr].events.push(event);
            daySlots[dateStr].busySlots.push({ start: s, end: e });
          }
          current.setDate(current.getDate() + 1);
        }
        return;
      }

      const dateStr = getDateKey(eventStart);
      if (!daySlots[dateStr]) return;
      daySlots[dateStr].events.push(event);

      if (isWorkBlock(event)) {
        daySlots[dateStr].workBlockEvents.push(event);
      } else {
        daySlots[dateStr].busySlots.push({ start: eventStart, end: eventEnd });
      }

      const eventContext = analyzeStudyPlannerEventContext(event);
      if (eventContext.requiresRestAfter) {
        daySlots[dateStr].heavyEvents.push({ event, context: eventContext });
        daySlots[dateStr].requiresRestAfter = true;
        if (!daySlots[dateStr].restReason) daySlots[dateStr].restReason = eventContext.description;
      }
    });

  Object.values(daySlots).filter((day) => day.requiresRestAfter && day.heavyEvents.length > 0).forEach((day) => {
    const nextDay = new Date(day.date); nextDay.setDate(nextDay.getDate() + 1);
    const nextDayKey = getDateKey(nextDay);
    if (daySlots[nextDayKey] && !daySlots[nextDayKey].requiresRestAfter) {
      daySlots[nextDayKey].requiresRestAfter = true;
      daySlots[nextDayKey].restReason = `día después de ${day.restReason || 'evento pesado'}`;
    }
  });

  const daysAnalysis = Object.values(daySlots)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => {
      const sorted = [...day.busySlots].sort((a, b) => a.start.getTime() - b.start.getTime());
      const merged: Array<{ start: Date; end: Date }> = [];
      sorted.forEach((slot) => {
        const prev = merged[merged.length - 1];
        if (prev && slot.start <= prev.end) { prev.end = new Date(Math.max(prev.end.getTime(), slot.end.getTime())); return; }
        merged.push({ start: new Date(slot.start), end: new Date(slot.end) });
      });
      const totalBusyMinutes = merged.reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()) / 60000, 0);
      const freeSlots = day.workBlockEvents.length > 0
        ? buildWorkBlockFreeSlots(day.date, day.workBlockEvents, merged, input.currentTime)
        : merged.length === 0 ? buildCompletelyFreeDaySlots(day.date, input.currentTime) : buildBusyDayFreeSlots(day.date, merged, input.currentTime);
      return { date: day.date, dateStr: day.dateStr, dayName: day.dayName, events: day.events, busySlots: merged, freeSlots, totalBusyMinutes, totalFreeMinutes: freeSlots.reduce((s, sl) => s + sl.durationMinutes, 0), heavyEvents: day.heavyEvents, requiresRestAfter: day.requiresRestAfter, restReason: day.restReason };
    });

  const calendarDataToSave = daysAnalysis.reduce<StudyPlannerCalendarDataMap>((acc, day) => {
    acc[day.dateStr] = { busySlots: day.busySlots.map((s) => ({ start: new Date(s.start), end: new Date(s.end) })), events: day.events };
    return acc;
  }, {});

  const totalFreeMinutes = daysAnalysis.reduce((sum, d) => sum + d.totalFreeMinutes, 0);
  const avgFreeHoursPerDay = daysAnalysis.length > 0 ? (totalFreeMinutes / 60 / daysAnalysis.length).toFixed(1) : '0.0';
  const daysWithFreeTime = [...daysAnalysis].filter((d) => d.totalFreeMinutes >= 60).sort((a, b) => b.totalFreeMinutes - a.totalFreeMinutes);
  const busiestDaysMap = new Map<string, number>();
  daysAnalysis.forEach((d) => busiestDaysMap.set(d.dayName, (busiestDaysMap.get(d.dayName) || 0) + d.totalBusyMinutes));
  const busiestDays = Array.from(busiestDaysMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

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

  return { avgFreeHoursPerDay, busiestDays, calendarDataToSave, daysAnalysis, daysWithFreeTime, profileAvailability };
}
