import type { StudyApproach, StudyPlannerPendingLesson } from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerComputedLessonDistribution,
  StudyPlannerScheduledLesson,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import { serializeLessonDistributionForStorage } from './lesson-distribution.service';

export interface StudyPlannerLessonDistributionResult {
  computedDistribution: StudyPlannerComputedLessonDistribution[];
  slotsAfterTarget: number;
  storedDistribution: StudyPlannerStoredLessonDistribution[];
  totalPendingLessons: number;
}

const MIN_SESSION_BEFORE_MODULE_BREAK = 45;

function getApproachMultiplier(approach: StudyApproach | null): number {
  if (approach === 'corto') return 0.8;
  if (approach === 'largo') return 1.2;
  return 1;
}

function assignLessonsToSlot(params: {
  approachMultiplier: number;
  assignedLessonIds: Set<string>;
  pendingLessons: StudyPlannerPendingLesson[];
  slotDuration: number;
  startIndex: number;
}): { lessons: StudyPlannerScheduledLesson[]; nextIndex: number } {
  const lessonsForSlot: StudyPlannerScheduledLesson[] = [];
  let currentIndex = params.startIndex;
  let currentSlotCourseId: string | null = null;
  let currentSlotModuleIndex: number | null = null;
  let usedDurationInSlot = 0;

  while (currentIndex < params.pendingLessons.length) {
    const lesson = params.pendingLessons[currentIndex];

    if (!lesson.lessonTitle || params.assignedLessonIds.has(lesson.lessonId)) {
      currentIndex += 1;
      continue;
    }

    const finalDuration = Math.ceil((lesson.durationMinutes || 15) * params.approachMultiplier);
    if (usedDurationInSlot + finalDuration > params.slotDuration) break;

    const isSlotEmpty = lessonsForSlot.length === 0;
    const isSameModule =
      isSlotEmpty ||
      (currentSlotModuleIndex !== null &&
        lesson.moduleOrderIndex === currentSlotModuleIndex &&
        lesson.courseId === currentSlotCourseId);

    if (!isSlotEmpty && !isSameModule && usedDurationInSlot >= MIN_SESSION_BEFORE_MODULE_BREAK) break;

    lessonsForSlot.push({
      courseTitle: lesson.courseTitle,
      durationMinutes: finalDuration,
      lessonOrderIndex: lesson.lessonOrderIndex,
      lessonTitle: lesson.lessonTitle,
      moduleOrderIndex: lesson.moduleOrderIndex,
      moduleTitle: lesson.moduleTitle,
    });

    params.assignedLessonIds.add(lesson.lessonId);
    usedDurationInSlot += finalDuration;
    currentSlotCourseId = lesson.courseId;
    currentSlotModuleIndex = lesson.moduleOrderIndex;
    currentIndex += 1;
  }

  return { lessons: lessonsForSlot, nextIndex: currentIndex };
}

function buildDistributionPhase(params: {
  approachMultiplier: number;
  assignedLessonIds: Set<string>;
  currentLessonIndex: number;
  distributions: StudyPlannerComputedLessonDistribution[];
  pendingLessons: StudyPlannerPendingLesson[];
  usedSlotKeys: Set<string>;
  slots: StudyPlannerCalendarFreeSlotWithDay[];
}): number {
  let nextLessonIndex = params.currentLessonIndex;

  for (const slot of params.slots) {
    if (nextLessonIndex >= params.pendingLessons.length) break;

    const slotKey = `${slot.dateStr}_${slot.start.toISOString()}`;
    if (params.usedSlotKeys.has(slotKey)) continue;

    const assignment = assignLessonsToSlot({
      approachMultiplier: params.approachMultiplier,
      assignedLessonIds: params.assignedLessonIds,
      pendingLessons: params.pendingLessons,
      slotDuration: slot.durationMinutes,
      startIndex: nextLessonIndex,
    });

    nextLessonIndex = assignment.nextIndex;
    if (assignment.lessons.length === 0) continue;

    params.usedSlotKeys.add(slotKey);
    params.distributions.push({
      lessons: assignment.lessons,
      slot: { dateStr: slot.dateStr, dayName: slot.dayName, end: slot.end, start: slot.start },
    });
  }

  return nextLessonIndex;
}

export function buildStudyPlannerLessonDistribution({
  approach,
  finalSlots,
  pendingLessons,
  targetDateObj,
}: {
  approach: StudyApproach | null;
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[];
  pendingLessons: StudyPlannerPendingLesson[];
  targetDateObj: Date | null;
}): StudyPlannerLessonDistributionResult {
  const approachMultiplier = getApproachMultiplier(approach);
  const sortedSlots = [...finalSlots].sort((l, r) => l.date.getTime() - r.date.getTime());

  const slotsUntilTarget = targetDateObj
    ? sortedSlots.filter((slot) => {
        const slotDate = new Date(slot.date); slotDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(targetDateObj); targetDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() <= targetDate.getTime();
      })
    : sortedSlots;

  const distributions: StudyPlannerComputedLessonDistribution[] = [];
  const usedSlotKeys = new Set<string>();
  const assignedLessonIds = new Set<string>();

  let currentLessonIndex = buildDistributionPhase({
    approachMultiplier, assignedLessonIds, currentLessonIndex: 0,
    distributions, pendingLessons, slots: slotsUntilTarget, usedSlotKeys,
  });

  if (currentLessonIndex < pendingLessons.length) {
    const unusedSlots = sortedSlots.filter((slot) => !usedSlotKeys.has(`${slot.dateStr}_${slot.start.toISOString()}`));
    currentLessonIndex = buildDistributionPhase({
      approachMultiplier, assignedLessonIds, currentLessonIndex,
      distributions, pendingLessons, slots: unusedSlots, usedSlotKeys,
    });
  }

  const slotsAfterTarget = targetDateObj
    ? sortedSlots.filter((slot) => {
        const slotDate = new Date(slot.date); slotDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(targetDateObj); targetDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() > targetDate.getTime();
      }).length
    : 0;

  return {
    computedDistribution: distributions,
    slotsAfterTarget,
    storedDistribution: serializeLessonDistributionForStorage(distributions),
    totalPendingLessons: pendingLessons.length,
  };
}

export function groupDistributionsByDay(
  distributions: StudyPlannerComputedLessonDistribution[],
): Map<string, StudyPlannerComputedLessonDistribution[]> {
  return distributions.reduce((map, distribution) => {
    const current = map.get(distribution.slot.dateStr) || [];
    current.push(distribution);
    map.set(distribution.slot.dateStr, current);
    return map;
  }, new Map<string, StudyPlannerComputedLessonDistribution[]>());
}
