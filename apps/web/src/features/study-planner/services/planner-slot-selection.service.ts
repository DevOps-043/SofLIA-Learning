import { HolidayService } from '../../../lib/holidays';
import type { SelectStudyPlannerFinalSlotsInput, SelectStudyPlannerFinalSlotsResult } from './planner-slot-selection.types';
import {
  MIN_SLOT_DURATION,
  USER_COUNTRY,
  buildCandidateSlots,
  computeWeeklyAvailableMinutes,
  distributeSlotsAcrossPeriod,
  divideLongSlots,
  getDateKey,
  isUpcomingSlot,
  selectNonOverlappingSlots,
  sortSlotsByQuality,
} from './planner-slot-selection-helpers.service';

export type {
  SelectStudyPlannerFinalSlotsInput,
  SelectStudyPlannerFinalSlotsResult,
} from './planner-slot-selection.types';

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
