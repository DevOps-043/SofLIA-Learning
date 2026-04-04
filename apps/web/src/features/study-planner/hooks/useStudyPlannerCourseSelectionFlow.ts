'use client';

import type { Dispatch, SetStateAction } from 'react';

import type {
  StudyPlannerCourseOption,
  StudyPlannerMessage,
} from '../types/planner-ui.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseStudyPlannerCourseSelectionFlowParams {
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
  setShowApproachModal: StateSetter<boolean>;
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
  'Perfecto! Vamos a crear tu plan de estudios. Que cursos te gustaria incluir?';

const COMPLETE_WELCOME_MESSAGE =
  'Perfecto! Ahora vamos a crear tu plan de estudios personalizado. Haz clic en "Seleccionar cursos" para elegir los cursos que quieres incluir en tu plan.';

function scheduleSpeech(
  message: string,
  speakText: (text: string) => Promise<void>,
): void {
  window.setTimeout(() => {
    void speakText(message);
  }, 500);
}

export function useStudyPlannerCourseSelectionFlow({
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
  setShowApproachModal,
  setShowConversation,
  setShowCourseSelector,
  speakText,
  stopAllAudio,
}: UseStudyPlannerCourseSelectionFlowParams): UseStudyPlannerCourseSelectionFlowResult {
  const loadUserCourses = async () => {
    setIsLoadingCourses(true);

    try {
      const response = await fetch('/api/my-courses');
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || data || [];

        setAvailableCourses(
          courses.map((course: Record<string, unknown> & { courses?: Record<string, unknown> }) => ({
            category: course.course_category || course.category || course.courses?.category || 'General',
            id: course.course_id || course.id,
            progress: course.progress_percentage || course.progress || 0,
            title: course.course_title || course.title || course.courses?.title || 'Curso sin nombre',
          })),
        );
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setAvailableCourses([
        { id: '1', title: 'Curso de ejemplo 1', category: 'IA', progress: 30 },
        { id: '2', title: 'Curso de ejemplo 2', category: 'Desarrollo', progress: 0 },
      ]);
    } finally {
      setIsLoadingCourses(false);
      setShowCourseSelector(true);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((previousCourseIds) =>
      previousCourseIds.includes(courseId)
        ? previousCourseIds.filter((id) => id !== courseId)
        : [...previousCourseIds, courseId],
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
    const courseNames = selectedCourses.map((course) => course.title).join(', ');

    const userMessage =
      selectedCourses.length > 0
        ? `He seleccionado estos cursos: ${courseNames}`
        : 'No he seleccionado ningun curso todavia';

    setConversationHistory((previousHistory) => [
      ...previousHistory,
      { role: 'user', content: userMessage },
    ]);

    window.setTimeout(async () => {
      setIsProcessing(true);

      try {
        if (selectedCourses.length > 0) {
          const responseMessage =
            `Excelente eleccion! Has seleccionado ${selectedCourses.length} curso${selectedCourses.length > 1 ? 's' : ''}: ${courseNames}.\n\n` +
            'Antes de crear tu plan de estudios personalizado, necesito conocer tu preferencia de ritmo de estudio.';

          setConversationHistory((previousHistory) => [
            ...previousHistory,
            { role: 'assistant', content: responseMessage },
          ]);
          setHasAskedApproach(true);

          window.setTimeout(() => {
            setShowApproachModal(true);
          }, 500);

          if (isAudioEnabled) {
            await speakText(
              'Excelente eleccion. Que tipo de sesiones de estudio prefieres?',
            );
          }

          return;
        }

        const emptySelectionMessage =
          'Parece que no seleccionaste ningun curso. Te gustaria ver tus cursos disponibles de nuevo o prefieres decirme que temas te interesan?';

        setConversationHistory((previousHistory) => [
          ...previousHistory,
          { role: 'assistant', content: emptySelectionMessage },
        ]);

        if (isAudioEnabled) {
          await speakText(emptySelectionMessage);
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
