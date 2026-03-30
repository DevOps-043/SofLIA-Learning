import type { StudyApproach } from '../types/planner-ui.types';
import type { StudyPlannerTargetWindow } from '../types/planner-schedule.types';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

interface ResolveStudyPlannerTargetWindowInput {
  targetDate?: string | null;
  studyApproach?: StudyApproach | null;
}

export function parseStudyPlannerTargetDate(targetDate?: string | null): Date | null {
  if (!targetDate || targetDate === 'No tengo fecha específica') {
    return null;
  }

  const formattedMatch = targetDate.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);

  if (formattedMatch) {
    const day = parseInt(formattedMatch[1], 10);
    const monthName = formattedMatch[2].toLowerCase();
    const month = MONTH_NAMES.findIndex((value) => value === monthName);
    const year = parseInt(formattedMatch[3], 10);

    if (month >= 0 && day > 0 && day <= 31 && year >= 2020) {
      const parsedDate = new Date(year, month, day);
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    }
  }

  const standardDate = new Date(targetDate);
  if (!Number.isNaN(standardDate.getTime()) && standardDate.getFullYear() >= 2020) {
    standardDate.setHours(0, 0, 0, 0);
    return standardDate;
  }

  return null;
}

export function resolveStudyPlannerTargetWindow(
  input: ResolveStudyPlannerTargetWindowInput,
): StudyPlannerTargetWindow {
  const targetDateObj = parseStudyPlannerTargetDate(input.targetDate);
  let weeksUntilTarget = 30;
  let bufferDays = 1;
  let adjustedTargetDate: Date | null = null;

  if (input.targetDate && input.studyApproach && input.targetDate !== 'No tengo fecha específica') {
    if (targetDateObj) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysDiff = Math.max(
        1,
        Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      );

      weeksUntilTarget = Math.ceil(daysDiff / 7);
      weeksUntilTarget = Math.max(1, Math.min(weeksUntilTarget, 52));

      if (weeksUntilTarget >= 8) {
        bufferDays = 3;
      } else if (weeksUntilTarget >= 4) {
        bufferDays = 2;
      }

      adjustedTargetDate = new Date(targetDateObj);
      adjustedTargetDate.setDate(adjustedTargetDate.getDate() - bufferDays);
    } else {
      weeksUntilTarget = 4;
    }
  }

  return {
    targetDateObj,
    weeksUntilTarget,
    bufferDays,
    adjustedTargetDate,
  };
}
