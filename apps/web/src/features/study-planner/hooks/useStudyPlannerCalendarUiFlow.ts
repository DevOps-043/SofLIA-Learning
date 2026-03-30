'use client';

import type { Dispatch, SetStateAction } from 'react';

import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';

type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;
type StateSetter<T> = Dispatch<SetStateAction<T>>;
type AnalyzeCalendarAndSuggest = (
  provider: CalendarProvider,
  targetDateParam?: string,
  approachParam?: StudyApproach | null,
) => Promise<void>;

interface UseStudyPlannerCalendarUiFlowParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  calendarSkipped: boolean;
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  getAnalyzeCalendarAndSuggest: () => AnalyzeCalendarAndSuggest;
  isAudioEnabled: boolean;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setCurrentMonth: StateSetter<Date | null>;
  setHasAskedTargetDate: StateSetter<boolean>;
  setHasConfiguredCalendars: StateSetter<boolean>;
  setIsConnectingCalendar: StateSetter<boolean>;
  setIsProcessing: StateSetter<boolean>;
  setSelectedDate: StateSetter<Date | null>;
  setShowApproachButtons: StateSetter<boolean>;
  setShowApproachModal: StateSetter<boolean>;
  setShowCalendarConfig: StateSetter<boolean>;
  setShowCalendarModal: StateSetter<boolean>;
  setShowDateModal: StateSetter<boolean>;
  setStudyApproach: StateSetter<StudyApproach | null>;
  setTargetDate: StateSetter<string | null>;
  speakText: (text: string) => Promise<void>;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
}

interface UseStudyPlannerCalendarUiFlowResult {
  handleApproachSelection: (approach: StudyApproach) => Promise<void>;
  handleCalendarConfigSaveSuccess: () => void;
  handleCalendarConnect: (provider: CalendarProvider) => Promise<void>;
  handleCalendarModalCloseButtonClick: () => void;
  handleCalendarModalOverlayClose: () => void;
  handleDateMonthChange: (date: Date) => void;
  handleDateSelection: (date: Date | null, skip?: boolean) => Promise<void>;
  handleTargetDateResponse: (dateResponse: string) => Promise<void>;
}

const APPROACH_LABELS: Record<StudyApproach, string> = {
  corto: 'terminar rapido (sesiones de 60-90 minutos)',
  balance: 'ritmo equilibrado (sesiones de 45-60 minutos)',
  largo: 'tomarte tu tiempo (sesiones de 20-35 minutos)',
};

function normalizeMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function calculateSuggestedDate(approach: StudyApproach): Date {
  const suggestedDate = new Date();
  const weeksToAdd = approach === 'corto' ? 2 : approach === 'balance' ? 4 : 8;
  suggestedDate.setDate(suggestedDate.getDate() + weeksToAdd * 7);
  return suggestedDate;
}

function formatApproachCompletionText(approach: StudyApproach | null): string {
  if (approach === 'corto') {
    return 'terminar rapido';
  }

  if (approach === 'balance') {
    return 'ritmo equilibrado';
  }

  return 'tomarte tu tiempo';
}

function formatCalendarProvider(provider: CalendarProvider): string {
  return provider === 'google' ? 'Google' : 'Microsoft';
}

export function useStudyPlannerCalendarUiFlow({
  assignedCourses,
  calendarSkipped,
  connectedCalendar,
  conversationHistory,
  getAnalyzeCalendarAndSuggest,
  isAudioEnabled,
  setConnectedCalendar,
  setConversationHistory,
  setCurrentMonth,
  setHasAskedTargetDate,
  setHasConfiguredCalendars,
  setIsConnectingCalendar,
  setIsProcessing,
  setSelectedDate,
  setShowApproachButtons,
  setShowApproachModal,
  setShowCalendarConfig,
  setShowCalendarModal,
  setShowDateModal,
  setStudyApproach,
  setTargetDate,
  speakText,
  studyApproach,
  targetDate,
  userContext,
}: UseStudyPlannerCalendarUiFlowParams): UseStudyPlannerCalendarUiFlowResult {
  const closeCalendarModalIfAllowed = () => {
    const isBlockingClose = userContext?.userType === 'b2b' && !connectedCalendar;
    if (!isBlockingClose && !connectedCalendar) {
      setShowCalendarModal(false);
      return;
    }

    if (connectedCalendar) {
      setShowCalendarModal(false);
    }
  };

  const resolveConnectedCalendarFromServer = async (): Promise<CalendarProvider | null> => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.isConnected && data.provider) {
        return data.provider as CalendarProvider;
      }
    } catch (error) {
      console.error('Error verificando estado del calendario:', error);
    }

    return null;
  };

  const handleCalendarConnect = async (provider: CalendarProvider) => {
    try {
      setIsConnectingCalendar(true);

      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexion');
      }

      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (error) {
      console.error('Error conectando calendario:', error);
      setIsConnectingCalendar(false);
    }
  };

  const handleCalendarModalOverlayClose = () => {
    if (userContext?.userType === 'b2b' && !connectedCalendar) {
      return;
    }

    if (!connectedCalendar) {
      setShowCalendarModal(false);
      return;
    }

    closeCalendarModalIfAllowed();
  };

  const handleCalendarModalCloseButtonClick = () => {
    if (userContext?.userType === 'b2b' && !connectedCalendar) {
      return;
    }

    closeCalendarModalIfAllowed();
  };

  const handleCalendarConfigSaveSuccess = () => {
    setHasConfiguredCalendars(true);
    setShowCalendarConfig(false);
  };

  const handleDateMonthChange = (date: Date) => {
    setCurrentMonth(normalizeMonth(date));
  };

  const handleDateSelection = async (date: Date | null, skip: boolean = false) => {
    const analyzeCalendarAndSuggest = getAnalyzeCalendarAndSuggest();

    if (skip) {
      setSelectedDate(null);
      setTargetDate('No tengo fecha especifica');
      setShowDateModal(false);

      const confirmationMessage =
        'Entendido, no hay problema. Procedere a crear tu plan de estudios sin una fecha especifica.\n\nDejame analizar tu calendario para crear las mejores recomendaciones.';

      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: confirmationMessage },
      ]);

      if (isAudioEnabled) {
        await speakText('Entendido. Procedere a crear tu plan de estudios sin una fecha especifica.');
      }

      setTimeout(async () => {
        if (connectedCalendar) {
          await analyzeCalendarAndSuggest(connectedCalendar, undefined, studyApproach);
          return;
        }

        setShowCalendarModal(true);
      }, 1500);

      return;
    }

    if (!date) {
      return;
    }

    const dateText = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    setSelectedDate(date);
    setCurrentMonth(normalizeMonth(date));
    setTargetDate(dateText);
    setShowDateModal(false);

    const confirmationMessage = `Excelente, he registrado tu fecha estimada: **${dateText}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${formatApproachCompletionText(studyApproach)}** y tu objetivo de completar los cursos para ${dateText}.\n\nDejame analizar tu disponibilidad...`;

    setConversationHistory((previousHistory) => [
      ...previousHistory,
      { role: 'assistant', content: confirmationMessage },
    ]);

    if (isAudioEnabled) {
      await speakText('Excelente. He registrado tu fecha estimada. Ahora voy a analizar tu calendario para crear las mejores recomendaciones.');
    }

    setTimeout(async () => {
      if (connectedCalendar) {
        await analyzeCalendarAndSuggest(connectedCalendar, dateText, studyApproach);
        return;
      }

      setShowCalendarModal(true);
    }, 1500);
  };

  const handleTargetDateResponse = async (dateResponse: string) => {
    const analyzeCalendarAndSuggest = getAnalyzeCalendarAndSuggest();

    setIsProcessing(true);

    const confirmationMessage = `Excelente, he registrado tu fecha estimada: **${dateResponse}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${formatApproachCompletionText(studyApproach)}** y tu objetivo de completar los cursos ${dateResponse.toLowerCase().includes('no') || dateResponse.toLowerCase().includes('especifica') ? 'en el tiempo que prefieras' : `para ${dateResponse}`}.\n\nDejame analizar tu disponibilidad...`;

    setConversationHistory((previousHistory) => [
      ...previousHistory,
      { role: 'assistant', content: confirmationMessage },
    ]);

    if (isAudioEnabled) {
      await speakText('Excelente. Ahora voy a analizar tu calendario para crear las mejores recomendaciones de horarios.');
    }

    setTimeout(async () => {
      if (connectedCalendar) {
        await analyzeCalendarAndSuggest(connectedCalendar, undefined, studyApproach);
        return;
      }

      setShowCalendarModal(true);
    }, 1500);

    setIsProcessing(false);
  };

  const handleApproachSelection = async (approach: StudyApproach) => {
    const analyzeCalendarAndSuggest = getAnalyzeCalendarAndSuggest();

    setShowApproachButtons(false);
    setStudyApproach(approach);
    setShowApproachModal(false);
    setIsProcessing(true);

    const dueDateCourses = assignedCourses.filter((course) => Boolean(course.dueDate));
    const nearestCourse = dueDateCourses[0];
    const resolvedTargetDate = nearestCourse?.dueDate ? new Date(nearestCourse.dueDate) : calculateSuggestedDate(approach);
    const resolvedTargetDateText = resolvedTargetDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setTargetDate(resolvedTargetDateText);
    setHasAskedTargetDate(true);
    setSelectedDate(resolvedTargetDate);
    setCurrentMonth(normalizeMonth(resolvedTargetDate));

    let calendarProvider: CalendarProvider | null = connectedCalendar;
    if (!calendarProvider) {
      calendarProvider = await resolveConnectedCalendarFromServer();
      if (calendarProvider) {
        setConnectedCalendar(calendarProvider);
      }
    }

    const courseTitles = assignedCourses.map((course) => course.title).join(', ');
    const systemPrompt = calendarProvider
      ? `[SELECCION_ENFOQUE_CALENDARIO_CONECTADO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
Ya tiene su calendario de ${formatCalendarProvider(calendarProvider)} conectado.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. Menciona que el calendario ya esta conectado.
3. Indica que vas a analizar su agenda para encontrar los mejores horarios.
4. Se breve y profesional.`
      : calendarSkipped
        ? `[SELECCION_ENFOQUE_SIN_CALENDARIO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
El usuario ya indico que prefiere no conectar su calendario.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}
Cursos asignados: ${courseTitles}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. No vuelvas a pedir calendario.
3. Pide dias y horarios preferidos para estudiar.`
        : `[SELECCION_ENFOQUE_PERSUADIR_CALENDARIO]
El usuario ha seleccionado "${APPROACH_LABELS[approach]}" como tipo de sesiones de estudio.
${resolvedTargetDateText ? `La fecha objetivo actual es: ${resolvedTargetDateText}` : ''}
Cursos asignados: ${courseTitles}

INSTRUCCIONES:
1. Confirma la seleccion del tipo de sesiones.
2. Explica brevemente el beneficio de conectar el calendario.
3. Pregunta si desea conectar Google o Microsoft Calendar.`;

    try {
      const currentDate = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const approachSystemPrompt = generateStudyPlannerPrompt({
        userName: userContext?.userName || undefined,
        studyPlannerContextString: `CURSOS ASIGNADOS:\n${assignedCourses
          .map((course) => `- ${course.title}${course.dueDate ? ` (Fecha limite: ${new Date(course.dueDate).toLocaleDateString('es-ES')})` : ''}`)
          .join('\n')}\n\nTIPO DE SESION SELECCIONADO: ${APPROACH_LABELS[approach]}`,
        currentDate,
      });

      const response = await fetch('/api/study-planner-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: systemPrompt,
          conversationHistory: conversationHistory.slice(-5),
          systemPrompt: approachSystemPrompt,
          userName: userContext?.userName || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          setConversationHistory((previousHistory) => [
            ...previousHistory,
            { role: 'assistant', content: data.response },
          ]);
        }

        if (isAudioEnabled) {
          const audioText = calendarProvider
            ? `Excelente. Has seleccionado ${APPROACH_LABELS[approach]}. Veo que ya tienes tu calendario conectado. Voy a analizar tu agenda.`
            : 'Excelente. Ya registre tu ritmo de estudio. Ahora te ayudare a conectar el calendario para personalizar tu plan.';
          await speakText(audioText);
        }
      } else {
        const fallbackMessage = calendarProvider
          ? `Excelente eleccion. Has seleccionado **${APPROACH_LABELS[approach]}**. Veo que ya tienes tu calendario conectado. Voy a analizar tu agenda para crear el mejor plan de estudios.`
          : `Excelente eleccion. Has seleccionado **${APPROACH_LABELS[approach]}**. Para crear un plan personalizado, ¿te gustaria conectar tu calendario?`;
        setConversationHistory((previousHistory) => [
          ...previousHistory,
          { role: 'assistant', content: fallbackMessage },
        ]);
      }
    } catch (error) {
      console.error('Error obteniendo respuesta de SofLIA:', error);
      const fallbackMessage = `Perfecto. Has seleccionado **${APPROACH_LABELS[approach]}**. ¿Te gustaria conectar tu calendario para personalizar tu plan?`;
      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: fallbackMessage },
      ]);
    } finally {
      setIsProcessing(false);
    }

    if (calendarProvider) {
      setTimeout(async () => {
        try {
          await analyzeCalendarAndSuggest(calendarProvider, resolvedTargetDateText || targetDate || undefined, approach);
        } catch (error) {
          console.error('Error en analyzeCalendarAndSuggest:', error);
          setIsProcessing(false);
          setConversationHistory((previousHistory) => [
            ...previousHistory,
            {
              role: 'assistant',
              content: `Tu calendario de ${formatCalendarProvider(calendarProvider)} esta conectado, pero hubo un problema al analizarlo.\n\n¿Que dias de la semana prefieres estudiar? ¿Y en que horario te concentras mejor: **manana**, **tarde** o **noche**?`,
            },
          ]);
        }
      }, 2000);
      return;
    }

    if (!calendarSkipped) {
      setTimeout(() => {
        setShowCalendarModal(true);
      }, 3000);
    }
  };

  return {
    handleApproachSelection,
    handleCalendarConfigSaveSuccess,
    handleCalendarConnect,
    handleCalendarModalCloseButtonClick,
    handleCalendarModalOverlayClose,
    handleDateMonthChange,
    handleDateSelection,
    handleTargetDateResponse,
  };
}
