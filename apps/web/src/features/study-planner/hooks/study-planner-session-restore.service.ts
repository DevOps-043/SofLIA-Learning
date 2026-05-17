import { ensureLessonDistributionIdentity } from '../services/lesson-distribution.service';
import type {
  StudyPlannerSessionRestoreParams,
} from './useStudyPlannerSessionStorage.types';

export function restoreStudyPlannerSession({
  session,
  setConversationHistory,
  setCurrentStep,
  setHasShownFinalSummary,
  setSavedLessonDistribution,
  setStudyApproach,
  setTargetDate,
}: StudyPlannerSessionRestoreParams) {
  if (session.conversationHistory) {
    setConversationHistory(session.conversationHistory);
  }
  if (session.savedLessonDistribution) {
    setSavedLessonDistribution(
      session.savedLessonDistribution.map((distribution) =>
        ensureLessonDistributionIdentity(distribution),
      ),
    );
  }
  if (session.currentStep) {
    setCurrentStep(session.currentStep);
  }
  if (session.studyApproach) {
    setStudyApproach(session.studyApproach);
  }
  if (session.targetDate) {
    setTargetDate(session.targetDate);
  }
  if (session.hasShownFinalSummary) {
    setHasShownFinalSummary(session.hasShownFinalSummary);
  }

  setConversationHistory((previousHistory) => [
    ...previousHistory,
    {
      role: 'system',
      content: '[SISTEMA] Sesion anterior restaurada exitosamente. Puedes continuar donde lo dejaste.',
    },
  ]);
}
