import { HolidayService } from '../../../lib/holidays';
import type {
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerTargetWindow,
} from '../types/planner-schedule.types';
import type { StudyApproach } from '../types/planner-ui.types';
import type { StudyPlannerAvailabilityEstimate } from './planner-calendar-analysis.service';
import type { OrganizationPlannerConfig } from './organization-planner-config.service';

interface SelectStudyPlannerFinalSlotsInput {
  currentTime: Date;
  daysAnalysis: StudyPlannerCalendarDayAnalysis[];
  hasOrganizationalDeadlines: boolean;
  organizationConfig?: OrganizationPlannerConfig | null;
  profileAvailability: StudyPlannerAvailabilityEstimate | null;
  skipB2BRedirect?: boolean;
  startDate: Date;
  studyApproach: StudyApproach | null;
  targetWindow: StudyPlannerTargetWindow;
  totalLessonsNeeded: number;
  userType?: 'b2b' | 'b2c' | null;
}

interface SelectStudyPlannerFinalSlotsResult {
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  weeklyAvailableMinutes: number;
}

const USER_COUNTRY = 'MX';
const MIN_SLOT_DURATION = 25;

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function isUpcomingSlot(slot: StudyPlannerCalendarFreeSlotWithDay, currentTime: Date): boolean {
  const slotDate = new Date(slot.date);
  slotDate.setHours(0, 0, 0, 0);
  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);

  if (slotDate.getTime() > today.getTime()) {
    return true;
  }

  if (slotDate.getTime() === today.getTime()) {
    return slot.start.getTime() > currentTime.getTime();
  }

  return false;
}

function sortSlotsByQuality(
  slotA: StudyPlannerCalendarFreeSlotWithDay,
  slotB: StudyPlannerCalendarFreeSlotWithDay,
): number {
  const durationA = slotA.durationMinutes;
  const durationB = slotB.durationMinutes;
  const isIdealDurationA = durationA >= 60 && durationA <= 180;
  const isIdealDurationB = durationB >= 60 && durationB <= 180;

  if (isIdealDurationA && !isIdealDurationB) {
    return -1;
  }

  if (!isIdealDurationA && isIdealDurationB) {
    return 1;
  }

  const hourA = slotA.start.getHours();
  const hourB = slotB.start.getHours();
  const isGoodTimeA = (hourA >= 7 && hourA < 12) || (hourA >= 12 && hourA < 18) || (hourA >= 18 && hourA < 22);
  const isGoodTimeB = (hourB >= 7 && hourB < 12) || (hourB >= 12 && hourB < 18) || (hourB >= 18 && hourB < 22);

  if (isGoodTimeA && !isGoodTimeB) {
    return -1;
  }

  if (!isGoodTimeA && isGoodTimeB) {
    return 1;
  }

  return durationB - durationA;
}

function buildCandidateSlots(
  daysAnalysis: StudyPlannerCalendarDayAnalysis[],
  currentTime: Date,
  minimumSessionDuration: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const slotsByDay = new Map<string, StudyPlannerCalendarFreeSlotWithDay[]>();

  daysAnalysis.forEach((day) => {
    if (day.requiresRestAfter) {
      return;
    }

    const validSlots = day.freeSlots
      .filter((slot) => slot.durationMinutes >= minimumSessionDuration && slot.durationMinutes <= 360)
      .map((slot) => ({
        ...slot,
        dayName: day.dayName,
        dateStr: day.dateStr,
        date: day.date,
        requiresRest: day.requiresRestAfter,
        restReason: day.restReason,
      }))
      .filter((slot) => isUpcomingSlot(slot, currentTime))
      .sort(sortSlotsByQuality);

    if (validSlots.length > 0) {
      slotsByDay.set(day.dateStr, validSlots.slice(0, 3));
    }
  });

  return Array.from(slotsByDay.entries())
    .sort((dayA, dayB) => new Date(dayA[0]).getTime() - new Date(dayB[0]).getTime())
    .flatMap(([, slots]) => slots);
}

function selectNonOverlappingSlots(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  minimumSessionDuration: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const slotsByDate = new Map<string, StudyPlannerCalendarFreeSlotWithDay[]>();

  slots.forEach((slot) => {
    if (!slotsByDate.has(slot.dateStr)) {
      slotsByDate.set(slot.dateStr, []);
    }

    slotsByDate.get(slot.dateStr)?.push(slot);
  });

  return Array.from(slotsByDate.keys())
    .sort((dateA, dateB) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .flatMap((dateKey) => {
      const daySlots = [...(slotsByDate.get(dateKey) || [])].sort((slotA, slotB) => {
        const diffA = Math.abs(slotA.durationMinutes - minimumSessionDuration);
        const diffB = Math.abs(slotB.durationMinutes - minimumSessionDuration);

        if (diffA !== diffB) {
          return diffA - diffB;
        }

        return sortSlotsByQuality(slotA, slotB);
      });

      return daySlots.reduce<StudyPlannerCalendarFreeSlotWithDay[]>((selectedSlots, slot) => {
        const overlaps = selectedSlots.some((selectedSlot) => {
          return (
            (slot.start >= selectedSlot.start && slot.start < selectedSlot.end)
            || (slot.end > selectedSlot.start && slot.end <= selectedSlot.end)
            || (slot.start <= selectedSlot.start && slot.end >= selectedSlot.end)
          );
        });

        if (!overlaps && slot.durationMinutes >= minimumSessionDuration) {
          selectedSlots.push(slot);
        }

        return selectedSlots;
      }, []);
    });
}

function divideLongSlots(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  studyApproach: StudyApproach | null,
  recommendedSessionLength: number,
  recommendedBreak: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const cycleLength = recommendedSessionLength + recommendedBreak;
  let maxSlotDuration = cycleLength * 2;

  if (studyApproach === 'corto') {
    maxSlotDuration = cycleLength * 3;
  } else if (studyApproach === 'largo') {
    maxSlotDuration = cycleLength;
  }

  return slots.flatMap((slot) => {
    if (slot.durationMinutes <= maxSlotDuration) {
      return [slot];
    }

    const divisions = Math.ceil(slot.durationMinutes / maxSlotDuration);
    const divisionDuration = Math.floor(slot.durationMinutes / divisions);

    return Array.from({ length: divisions }, (_, index) => {
      const divisionStart = new Date(slot.start.getTime() + index * divisionDuration * 60 * 1000);
      const divisionEnd = new Date(divisionStart.getTime() + divisionDuration * 60 * 1000);

      if (divisionEnd > slot.end) {
        return null;
      }

      return {
        ...slot,
        start: divisionStart,
        end: divisionEnd,
        durationMinutes: divisionDuration,
      };
    }).filter((slotPart): slotPart is StudyPlannerCalendarFreeSlotWithDay => slotPart !== null);
  });
}

function distributeSlotsAcrossPeriod(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  hasOrganizationalDeadlines: boolean,
  isB2BUser: boolean,
  totalLessonsNeeded: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  if (isB2BUser || hasOrganizationalDeadlines) {
    return slots;
  }

  if (slots.length === 0) {
    return [];
  }

  const estimatedLessons = Math.max(totalLessonsNeeded, 30);
  const slotsNeeded = Math.ceil(estimatedLessons / 2);
  const slotsToUse = Math.min(slotsNeeded, slots.length);

  if (slotsToUse >= slots.length || slotsToUse <= 1) {
    return slots.slice(0, slotsToUse);
  }

  const selectedSlots: StudyPlannerCalendarFreeSlotWithDay[] = [];
  const step = (slots.length - 1) / (slotsToUse - 1);

  for (let index = 0; index < slotsToUse; index += 1) {
    selectedSlots.push(slots[Math.round(index * step)]);
  }

  return selectedSlots;
}

function computeWeeklyAvailableMinutes(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  startDate: Date,
  weeksUntilTarget: number,
  defaultWeeklyMinutes: number,
): number {
  if (slots.length === 0) {
    return defaultWeeklyMinutes;
  }

  const effectiveWeeks = Math.max(1, weeksUntilTarget);
  const firstWeeksSlots = slots.filter((slot) => {
    const daysFromStart = Math.floor((slot.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysFromStart >= 0 && daysFromStart < (effectiveWeeks * 7);
  });

  if (firstWeeksSlots.length > 0) {
    const totalMinutes = firstWeeksSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
    return Math.round(totalMinutes / effectiveWeeks);
  }

  const slotsPerWeek = Math.max(1, Math.ceil(slots.length / effectiveWeeks));
  return slots.reduce((sum, slot) => sum + slot.durationMinutes, 0) / slotsPerWeek;
}

export function selectStudyPlannerFinalSlots(
  input: SelectStudyPlannerFinalSlotsInput,
): SelectStudyPlannerFinalSlotsResult {
  const minimumSessionDuration = input.profileAvailability?.recommendedSessionLength || 30;
  const recommendedBreak = input.profileAvailability?.recommendedBreak || 10;
  const recommendedSlots = buildCandidateSlots(
    input.daysAnalysis,
    input.currentTime,
    minimumSessionDuration,
  )
    .filter((slot) => slot.start.getHours() >= 7)
    .filter((slot) => slot.end.getHours() < 22 || (slot.end.getHours() === 22 && slot.end.getMinutes() === 0))
    .filter((slot) => !HolidayService.isHoliday(slot.date, USER_COUNTRY))
    .filter((slot) => {
      const iso = slot.date.toISOString();
      return !iso.includes('-01-01T')
        && !iso.includes('-12-25T')
        && !iso.includes('-05-01T')
        && !iso.includes('-09-16T')
        && !iso.includes('-11-20T');
    });

  const uniqueSlots = selectNonOverlappingSlots(recommendedSlots, minimumSessionDuration);
  const targetDateObj = input.targetWindow.targetDateObj;

  const validDateSlots = targetDateObj
    ? uniqueSlots.filter((slot) => {
      const slotDateOnly = new Date(slot.date);
      slotDateOnly.setHours(0, 0, 0, 0);
      const targetDateOnly = new Date(targetDateObj);
      targetDateOnly.setHours(0, 0, 0, 0);

      const isBeforeDeadline = slotDateOnly.getTime() < targetDateOnly.getTime();
      const isDeadlineDay = HolidayService.isSameDay(slotDateOnly, targetDateOnly);
      const isB2B = input.userType === 'b2b';

      return !((!isBeforeDeadline && !isDeadlineDay) || (isDeadlineDay && isB2B));
    })
    : uniqueSlots;

  const upcomingSlots = validDateSlots
    .filter((slot) => slot.durationMinutes >= MIN_SLOT_DURATION)
    .filter((slot) => isUpcomingSlot(slot, input.currentTime));

  const dividedSlots = divideLongSlots(
    upcomingSlots,
    input.studyApproach,
    minimumSessionDuration,
    recommendedBreak,
  );

  const maxSlotsPerDay = input.organizationConfig?.maxLessonsPerDay
    ?? (input.userType === 'b2b' && !input.skipB2BRedirect ? 4 : 2);
  const slotsByDay = new Map<string, StudyPlannerCalendarFreeSlotWithDay[]>();

  dividedSlots.forEach((slot) => {
    const dayKey = getDateKey(slot.date);
    if (!slotsByDay.has(dayKey)) {
      slotsByDay.set(dayKey, []);
    }

    slotsByDay.get(dayKey)?.push(slot);
  });

  const limitedSlots = Array.from(slotsByDay.values())
    .flatMap((daySlots) => [...daySlots].sort(sortSlotsByQuality).slice(0, maxSlotsPerDay))
    .sort((slotA, slotB) => slotA.date.getTime() - slotB.date.getTime());

  const finalSlots = distributeSlotsAcrossPeriod(
    limitedSlots,
    input.hasOrganizationalDeadlines,
    input.userType === 'b2b' && !input.skipB2BRedirect,
    input.totalLessonsNeeded,
  );

  return {
    finalSlots,
    weeklyAvailableMinutes: computeWeeklyAvailableMinutes(
      finalSlots,
      input.startDate,
      input.targetWindow.weeksUntilTarget,
      input.profileAvailability?.weeklyMinutes || 300,
    ),
  };
}
