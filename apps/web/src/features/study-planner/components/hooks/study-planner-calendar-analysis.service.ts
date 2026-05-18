import { logger as techDebtLogger } from '@/lib/utils/logger'
import { calculateStudyPlannerTotalLessonsNeeded } from '../../services/planner-course-workload.service';
import { buildStudyPlannerAudioSummary, buildStudyPlannerCalendarRecommendationMessage, buildStudyPlannerLessonDistribution } from '../../services/planner-calendar-recommendation.service';
import { resolveStudyPlannerPendingLessonsForRecommendations } from '../../services/planner-pending-lessons.service';
import { analyzeStudyPlannerSlotCalendar } from '../../services/planner-slot-analysis.service';
import { selectStudyPlannerFinalSlots } from '../../services/planner-slot-selection.service';
import { resolveStudyPlannerTargetWindow } from '../../services/planner-target-window.service';
import { fetchStudyPlannerUserContext } from '../../services/planner-user-context-client.service';
import {
  appendCalendarRecommendationMessage,
  buildCalendarAnalysisErrorMessage,
  fetchStudyPlannerCalendarEvents,
  normalizePlannerUserType,
} from './study-planner-calendar-actions.shared';
import { resolveStudyPlannerEffectiveTargetDate } from './study-planner-calendar-target-date.service';
import type {
  StudyPlannerAnalyzeCalendarAndSuggest,
  StudyPlannerAnalyzeCalendarAndSuggestParams,
} from './study-planner-calendar-actions.types';

const defaultDependencies = {
  analyzeStudyPlannerSlotCalendar,
  buildStudyPlannerAudioSummary,
  buildStudyPlannerCalendarRecommendationMessage,
  buildStudyPlannerLessonDistribution,
  calculateStudyPlannerTotalLessonsNeeded,
  fetchStudyPlannerUserContext,
  resolveStudyPlannerPendingLessonsForRecommendations,
  resolveStudyPlannerTargetWindow,
  selectStudyPlannerFinalSlots,
};

type StudyPlannerCalendarAnalysisDependencies = typeof defaultDependencies;

export { resolveStudyPlannerEffectiveTargetDate } from './study-planner-calendar-target-date.service';

export function createAnalyzeCalendarAndSuggestHandler(
  params: StudyPlannerAnalyzeCalendarAndSuggestParams,
  dependencies: Partial<StudyPlannerCalendarAnalysisDependencies> = {},
): StudyPlannerAnalyzeCalendarAndSuggest {
  const deps: StudyPlannerCalendarAnalysisDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  return async (
    provider,
    targetDateParam,
    approachParam,
    skipB2BRedirect,
  ) => {
    const { effectiveApproach, effectiveTargetDate } =
      resolveStudyPlannerEffectiveTargetDate({
        approachParam,
        assignedCourses: params.assignedCourses,
        studyApproach: params.studyApproach,
        targetDate: params.targetDate,
        targetDateParam,
      });

    if (params.isProcessing) {
      techDebtLogger.warn(
        '[analyzeCalendarAndSuggest] Se llamo mientras estaba procesando. Continuando para recuperar el flujo.',
      );
    }

    if (!effectiveApproach) {
      params.setIsProcessing(false);
      return;
    }

    params.setIsProcessing(true);
    const processingTimeout = globalThis.setTimeout(() => {
      params.setIsProcessing(false);
    }, 45000);

    try {
      const fetchedUserContext = await deps.fetchStudyPlannerUserContext();
      const userProfile = fetchedUserContext.rawProfile;

      if (fetchedUserContext.userContext) {
        params.setUserContext(fetchedUserContext.userContext);
      }

      if (
        userProfile?.userType === 'b2b'
        && params.assignedCourses.length > 0
        && !skipB2BRedirect
      ) {
        await params.analyzeCalendarAndSuggestB2B(
          provider,
          effectiveApproach,
          userProfile,
          params.assignedCourses,
        );
        return;
      }

      const userProfileForAnalysis = userProfile
        ? {
            professionalProfile: userProfile.professionalProfile || null,
            userType: normalizePlannerUserType(userProfile.userType),
          }
        : null;

      const targetWindow = deps.resolveStudyPlannerTargetWindow({
        targetDate: effectiveTargetDate,
        studyApproach: effectiveApproach,
      });

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const currentTime = new Date();
      const endDate = targetWindow.targetDateObj
        ? new Date(targetWindow.targetDateObj)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);

      const calendarEventsResult = await fetchStudyPlannerCalendarEvents({
        endDate,
        provider,
        setConnectedCalendar: params.setConnectedCalendar,
        setConversationHistory: params.setConversationHistory,
        setShowCalendarModal: params.setShowCalendarModal,
        startDate,
      });

      if (calendarEventsResult.shouldAbort) {
        return;
      }

      const {
        busiestDays,
        calendarDataToSave,
        daysAnalysis,
        daysWithFreeTime,
        profileAvailability,
      } = deps.analyzeStudyPlannerSlotCalendar({
        calendarEvents: calendarEventsResult.events || [],
        currentTime,
        effectiveApproach,
        effectiveTargetDate,
        startDate,
        targetDateObjForEvents: targetWindow.targetDateObj,
        userProfile: userProfileForAnalysis,
      });

      params.setSavedCalendarData(calendarDataToSave);

      const totalLessonsNeeded =
        params.selectedCourseIds.length > 0
          ? await deps.calculateStudyPlannerTotalLessonsNeeded({
              selectedCourseIds: params.selectedCourseIds,
            })
          : 0;

      const { finalSlots } = deps.selectStudyPlannerFinalSlots({
        currentTime,
        daysAnalysis,
        hasOrganizationalDeadlines: Boolean(
          userProfile?.courses?.some((course) => Boolean(course?.dueDate)),
        ),
        profileAvailability,
        skipB2BRedirect,
        startDate,
        studyApproach: effectiveApproach,
        targetWindow,
        totalLessonsNeeded,
        userType:
          params.userContext?.userType
          || fetchedUserContext.userContext?.userType
          || null,
      });

      const pendingLessons =
        params.selectedCourseIds.length > 0
          ? await deps.resolveStudyPlannerPendingLessonsForRecommendations({
              availableCourses: params.availableCourses,
              cachedPendingLessons:
                params.pendingLessonsRef.current.length > 0
                  ? params.pendingLessonsRef.current
                  : params.pendingLessonsWithNames,
              selectedCourseIds: params.selectedCourseIds,
              userId: params.userId,
            })
          : [];

      params.pendingLessonsRef.current = pendingLessons;
      params.setPendingLessonsWithNames(pendingLessons);

      const distributionResult = deps.buildStudyPlannerLessonDistribution({
        approach: effectiveApproach,
        finalSlots,
        pendingLessons,
        targetDateObj: targetWindow.targetDateObj,
      });

      params.setSavedLessonDistribution(distributionResult.storedDistribution);
      params.setSavedTargetDate(effectiveTargetDate || null);
      params.setSavedTotalLessons(distributionResult.totalPendingLessons);

      const calendarMessage =
        deps.buildStudyPlannerCalendarRecommendationMessage({
          busiestDays,
          calendarEventsCount: (calendarEventsResult.events || []).length,
          distributionResult,
          effectiveApproach,
          effectiveTargetDate: effectiveTargetDate || null,
          finalSlots,
          profileAvailability,
          provider,
          userProfile,
        });

      appendCalendarRecommendationMessage(
        calendarMessage,
        params.setConversationHistory,
      );

      if (params.isAudioEnabled) {
        await params.speakText(
          deps.buildStudyPlannerAudioSummary({
            calendarEventsCount: (calendarEventsResult.events || []).length,
            daysWithFreeTime,
            finalSlots,
          }),
        );
      }
    } catch (error) {
      techDebtLogger.error('Error analizando calendario:', error);

      const errorMessage = buildCalendarAnalysisErrorMessage(provider);
      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: errorMessage },
      ]);

      if (params.isAudioEnabled) {
        await params.speakText(
          'Calendario conectado. Que dias y horarios prefieres para estudiar?',
        );
      }
    } finally {
      globalThis.clearTimeout(processingTimeout);
      params.setIsProcessing(false);
    }
  };
}
