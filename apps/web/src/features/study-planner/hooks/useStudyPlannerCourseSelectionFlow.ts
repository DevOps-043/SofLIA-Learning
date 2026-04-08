'use client';

import type { Dispatch, SetStateAction } from 'react';

import type {
  StudyPlannerAssignedCourse,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
} from '../types/planner-ui.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseStudyPlannerCourseSelectionFlowParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  availableCourses: StudyPlannerCourseOption[];
  isAudioEnabled: boolean;
  selectedCourseIds: string[];
  setAvailableCourses: StateSetter<StudyPlannerCourseOption[]>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setHasAskedApproach: StateSetter<boolean>;
  setIsLoadingCourses: StateSetter<boolean>;
  setIsProcessing: StateSetter<boolean>;
  setIsVisible: StateSetter<boolean>;
  setSelectedCourseIds: StateSetter<string[]>;
  setShowApproachButtons: StateSetter<boolean>;
  setShowConversation: StateSetter<boolean>;
  setShowCourseSelector: StateSetter<boolean>;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
}

interface UseStudyPlannerCourseSelectionFlowResult {
  confirmCourseSelection: () => void;
  handleComplete: () => void;
  handleSkip: () => void;
  loadUserCourses: () => Promise<void>;
  toggleCourseSelection: (courseId: string) => void;
}

const SKIP_WELCOME_MESSAGE =
  'Perfecto! Vamos a crear tu plan de estudios. Que curso te gustaria planificar?';

const COMPLETE_WELCOME_MESSAGE =
  'Perfecto! Ahora vamos a seleccionar el curso que quieres planificar. Haz clic en "Seleccionar curso" para elegir.';

function scheduleSpeech(
  message: string,
  speakText: (text: string) => Promise<void>,
): void {
  window.setTimeout(() => {
    void speakText(message);
  }, 500);
}

export function useStudyPlannerCourseSelectionFlow({
  assignedCourses,
  availableCourses,
  isAudioEnabled,
  selectedCourseIds,
  setAvailableCourses,
  setConversationHistory,
  setHasAskedApproach,
  setIsLoadingCourses,
  setIsProcessing,
  setIsVisible,
  setSelectedCourseIds,
  setShowApproachButtons,
  setShowConversation,
  setShowCourseSelector,
  speakText,
  stopAllAudio,
}: UseStudyPlannerCourseSelectionFlowParams): UseStudyPlannerCourseSelectionFlowResult {
  /**
   * Uses already-loaded assignedCourses from context instead of fetching /api/my-courses.
   * This avoids a redundant API call and works correctly for B2B users whose courses
   * come from organization_course_assignments, not course_purchases.
   */
  const loadUserCourses = async () => {
    setIsLoadingCourses(true);

    try {
      setAvailableCourses(
        assignedCourses
          .filter((course) => !course.hasActivePlan)
          .map((course) => {
            const courseId = course.courseId || '';
            // Generate a unique selection key so the same course assigned by
            // different organizations appears as separate, independently selectable items.
            const id = course.organizationName
              ? `${courseId}__${course.organizationName}`
              : courseId || course.id || '';
            return {
              category: 'General',
              courseId,
              id,
              organizationName: course.organizationName ?? undefined,
              progress: course.progress ?? 0,
              title: course.title,
            };
          }),
      );
    } finally {
      setIsLoadingCourses(false);
      setShowCourseSelector(true);
    }
  };

  /**
   * Single-select: replaces the previous selection entirely.
   * Only one course can be planned at a time (RF-01, RF-03).
   */
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((previousCourseIds) =>
      previousCourseIds.includes(courseId) ? [] : [courseId],
    );
  };

  const handleSkip = () => {
    stopAllAudio();
    setIsVisible(false);
    setShowConversation(true);
    setConversationHistory([{ role: 'assistant', content: SKIP_WELCOME_MESSAGE }]);
    scheduleSpeech(SKIP_WELCOME_MESSAGE, speakText);
    void loadUserCourses();
  };

  const handleComplete = () => {
    stopAllAudio();
    setIsVisible(false);
    setShowConversation(true);
    setConversationHistory([{ role: 'assistant', content: COMPLETE_WELCOME_MESSAGE }]);
    scheduleSpeech(COMPLETE_WELCOME_MESSAGE, speakText);
  };

  const confirmCourseSelection = () => {
    setShowCourseSelector(false);

    const selectedCourses = availableCourses.filter((course) =>
      selectedCourseIds.includes(course.id),
    );

    if (selectedCourses.length === 0) {
      const emptySelectionMessage =
        'Parece que no seleccionaste ningun curso. Te gustaria ver tus cursos disponibles de nuevo?';

      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'user', content: 'No he seleccionado ningun curso todavia' },
        { role: 'assistant', content: emptySelectionMessage },
      ]);

      if (isAudioEnabled) {
        void speakText(emptySelectionMessage);
      }
      return;
    }

    // Single course selected
    const selectedCourse = selectedCourses[0];
    const userMessage = `Quiero planificar el curso: ${selectedCourse.title}`;

    setConversationHistory((previousHistory) => [
      ...previousHistory,
      { role: 'user', content: userMessage },
    ]);

    window.setTimeout(async () => {
      setIsProcessing(true);

      try {
        const responseMessage =
          `Excelente eleccion! Vamos a planificar **${selectedCourse.title}**.\n\n` +
          'Antes de crear tu plan de estudios personalizado, necesito conocer tu preferencia de ritmo de estudio.';

        setConversationHistory((previousHistory) => [
          ...previousHistory,
          { role: 'assistant', content: responseMessage },
        ]);
        setHasAskedApproach(true);

        window.setTimeout(() => {
          setShowApproachButtons(true);
        }, 500);

        if (isAudioEnabled) {
          await speakText(
            'Excelente eleccion. Que tipo de sesiones de estudio prefieres?',
          );
        }
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  };

  return {
    confirmCourseSelection,
    handleComplete,
    handleSkip,
    loadUserCourses,
    toggleCourseSelection,
  };
}
