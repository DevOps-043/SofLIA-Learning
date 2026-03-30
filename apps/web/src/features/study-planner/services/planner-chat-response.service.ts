import {
  filterHolidayLessonDistributions,
  mergeLessonDistributions,
  shouldReplaceLessonDistribution,
} from './lesson-distribution.service';
import {
  sanitizePlannerAssistantResponse,
  shouldMarkFinalSummaryFromResponse,
  shouldOpenCourseSelectorFromResponse,
  shouldTriggerPlannerFinalSave,
} from './planner-guardrails.service';
import { parseLiaResponseToSchedules } from './plan-parser.service';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

export interface ProcessStudyPlannerChatResponseParams {
  liaResponse: string;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  isAddingSchedules: boolean;
  isConfirmingSchedules: boolean;
  hasShownFinalSummary: boolean;
}

export interface ProcessStudyPlannerChatResponseResult {
  sanitizedResponse: string;
  nextSavedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  shouldMarkFinalSummaryShown: boolean;
  shouldOpenCourseSelector: boolean;
  hasExtractedSchedules: boolean;
}

export { shouldTriggerPlannerFinalSave };

export function processStudyPlannerChatResponse(
  params: ProcessStudyPlannerChatResponseParams,
): ProcessStudyPlannerChatResponseResult {
  const sanitizedResponse = sanitizePlannerAssistantResponse(params.liaResponse);
  const extractedSchedulesRaw = parseLiaResponseToSchedules(sanitizedResponse);
  const extractedSchedules = filterHolidayLessonDistributions(extractedSchedulesRaw);

  let nextSavedLessonDistribution = params.savedLessonDistribution;

  if (extractedSchedules.length > 0) {
    const replaceExisting = shouldReplaceLessonDistribution({
      liaResponse: sanitizedResponse,
      extractedSchedulesCount: extractedSchedules.length,
      existingSchedulesCount: params.savedLessonDistribution.length,
      isAddingSchedules: params.isAddingSchedules,
      isConfirmingSchedules: params.isConfirmingSchedules,
    });

    nextSavedLessonDistribution = mergeLessonDistributions(
      params.savedLessonDistribution,
      extractedSchedules,
      { replaceExisting },
    );
  }

  return {
    sanitizedResponse,
    nextSavedLessonDistribution,
    shouldMarkFinalSummaryShown:
      params.isConfirmingSchedules
      && !params.hasShownFinalSummary
      && shouldMarkFinalSummaryFromResponse(sanitizedResponse),
    shouldOpenCourseSelector: shouldOpenCourseSelectorFromResponse(sanitizedResponse),
    hasExtractedSchedules: extractedSchedules.length > 0,
  };
}
