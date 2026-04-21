import { parsePlannerDateString } from './lesson-distribution.service';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';
import {
  extractLessonFromLine,
  finalizeParsedSchedules,
  flushCurrentSchedule,
  hasScheduleShape,
  normalizeComparableText,
  parseDateFromLine,
  parseTimeRangeFromLine,
  stripTimeRangeFromLine,
} from './plan-parser.helpers';

export function parseLiaResponseToSchedules(text: string): StudyPlannerStoredLessonDistribution[] {
  if (!text || !hasScheduleShape(text)) {
    return [];
  }

  const schedules: StudyPlannerStoredLessonDistribution[] = [];
  let currentDate: { dateStr: string; dayName: string } | null = null;
  let currentSchedule: StudyPlannerStoredLessonDistribution | null = null;
  let currentContextDate: Date | undefined;

  text.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return;
    }

    if (isSummaryLine(trimmedLine)) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      return;
    }

    const normalizedLine = normalizeComparableText(trimmedLine);
    if (normalizedLine.startsWith('semana')) {
      const parsed = parsePlannerDateString(normalizedLine);
      if (parsed) {
        currentContextDate = parsed;
      }
      return;
    }

    const nextDate = parseDateFromLine(trimmedLine, currentContextDate);
    const nextTimeRange = parseTimeRangeFromLine(trimmedLine);
    const lineForLesson = nextTimeRange ? stripTimeRangeFromLine(trimmedLine) : trimmedLine;

    if (nextDate && nextTimeRange) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentDate = nextDate;
      currentSchedule = createSchedule(nextDate, nextTimeRange);
    } else if (nextDate) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentDate = nextDate;
      return;
    } else if (nextTimeRange && currentDate) {
      currentSchedule = flushCurrentSchedule(schedules, currentSchedule);
      currentSchedule = createSchedule(currentDate, nextTimeRange);
    }

    if (!currentSchedule || !lineForLesson) {
      return;
    }

    const lesson = extractLessonFromLine(lineForLesson);
    if (lesson) {
      currentSchedule.lessons.push(lesson);
    }
  });

  flushCurrentSchedule(schedules, currentSchedule);
  return finalizeParsedSchedules(schedules);
}

function createSchedule(
  date: { dateStr: string; dayName: string },
  timeRange: { startTime: string; endTime: string },
): StudyPlannerStoredLessonDistribution {
  return {
    clientReferenceId: '',
    dateStr: date.dateStr,
    dayName: date.dayName,
    startTime: timeRange.startTime,
    endTime: timeRange.endTime,
    lessons: [],
  };
}

function isSummaryLine(line: string): boolean {
  const normalized = line.toLowerCase();
  return line.startsWith('---') ||
    normalized.includes('resumen del plan') ||
    normalized.includes('resumen:');
}
