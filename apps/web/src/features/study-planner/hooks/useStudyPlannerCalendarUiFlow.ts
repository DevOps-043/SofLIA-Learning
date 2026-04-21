'use client';

import type { Dispatch, SetStateAction } from 'react';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import {
  APPROACH_LABELS,
  normalizeMonth,
  calculateSuggestedDate,
  formatApproachCompletionText,
  formatCalendarProvider,
  resolveConnectedCalendarFromServer,
  buildApproachSystemPrompt,
  buildApproachStudyPlannerPrompt,
} from './study-planner-calendar-ui-helpers';

type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;
type StateSetter<T> = Dispatch<SetStateAction<T>>;
type AnalyzeCalendarAndSuggest = (provider: CalendarProvider, targetDateParam?: string, approachParam?: StudyApproach | null) => Promise<void>;

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

export function useStudyPlannerCalendarUiFlow({
  assignedCourses, calendarSkipped, connectedCalendar, conversationHistory,
  getAnalyzeCalendarAndSuggest, isAudioEnabled, setConnectedCalendar, setConversationHistory,
  setCurrentMonth, setHasAskedTargetDate, setHasConfiguredCalendars, setIsConnectingCalendar,
  setIsProcessing, setSelectedDate, setShowApproachButtons, setShowApproachModal,
  setShowCalendarConfig, setShowCalendarModal, setShowDateModal, setStudyApproach,
  setTargetDate, speakText, studyApproach, targetDate, userContext,
}: UseStudyPlannerCalendarUiFlowParams) {
  const closeCalendarModal = () => {
    const blocking = userContext?.userType === 'b2b' && !connectedCalendar;
    if (!blocking && !connectedCalendar) { setShowCalendarModal(false); return; }
    if (connectedCalendar) setShowCalendarModal(false);
  };

  const handleCalendarConnect = async (provider: CalendarProvider) => {
    try {
      setIsConnectingCalendar(true);
      const response = await fetch('/api/study-planner/calendar/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) });
      if (!response.ok) throw new Error('Error al iniciar la conexion');
      const data = await response.json();
      if (data.success && data.data?.authUrl) window.location.href = data.data.authUrl;
    } catch (error) {
      console.error('Error conectando calendario:', error);
      setIsConnectingCalendar(false);
    }
  };

  const handleCalendarModalOverlayClose = () => {
    if (userContext?.userType === 'b2b' && !connectedCalendar) return;
    if (!connectedCalendar) { setShowCalendarModal(false); return; }
    closeCalendarModal();
  };

  const handleCalendarModalCloseButtonClick = () => {
    if (userContext?.userType === 'b2b' && !connectedCalendar) return;
    closeCalendarModal();
  };

  const handleCalendarConfigSaveSuccess = () => { setHasConfiguredCalendars(true); setShowCalendarConfig(false); };
  const handleDateMonthChange = (date: Date) => setCurrentMonth(normalizeMonth(date));

  const handleDateSelection = async (date: Date | null, skip = false) => {
    const analyze = getAnalyzeCalendarAndSuggest();
    if (skip) {
      setSelectedDate(null); setTargetDate('No tengo fecha especifica'); setShowDateModal(false);
      setConversationHistory((prev) => [...prev, { role: 'assistant', content: 'Entendido, no hay problema. Procedere a crear tu plan de estudios sin una fecha especifica.\n\nDejame analizar tu calendario para crear las mejores recomendaciones.' }]);
      if (isAudioEnabled) await speakText('Entendido. Procedere a crear tu plan de estudios sin una fecha especifica.');
      setTimeout(async () => { if (connectedCalendar) { await analyze(connectedCalendar, undefined, studyApproach); return; } setShowCalendarModal(true); }, 1500);
      return;
    }
    if (!date) return;
    const dateText = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    setSelectedDate(date); setCurrentMonth(normalizeMonth(date)); setTargetDate(dateText); setShowDateModal(false);
    setConversationHistory((prev) => [...prev, { role: 'assistant', content: `Excelente, he registrado tu fecha estimada: **${dateText}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${formatApproachCompletionText(studyApproach)}** y tu objetivo de completar los cursos para ${dateText}.\n\nDejame analizar tu disponibilidad...` }]);
    if (isAudioEnabled) await speakText('Excelente. He registrado tu fecha estimada. Ahora voy a analizar tu calendario para crear las mejores recomendaciones.');
    setTimeout(async () => { if (connectedCalendar) { await analyze(connectedCalendar, dateText, studyApproach); return; } setShowCalendarModal(true); }, 1500);
  };

  const handleTargetDateResponse = async (dateResponse: string) => {
    const analyze = getAnalyzeCalendarAndSuggest();
    setIsProcessing(true);
    const isNoDate = dateResponse.toLowerCase().includes('no') || dateResponse.toLowerCase().includes('especifica');
    setConversationHistory((prev) => [...prev, { role: 'assistant', content: `Excelente, he registrado tu fecha estimada: **${dateResponse}**.\n\nAhora voy a analizar tu calendario para crear las mejores recomendaciones de horarios que se ajusten a tu enfoque de **${formatApproachCompletionText(studyApproach)}** y tu objetivo de completar los cursos ${isNoDate ? 'en el tiempo que prefieras' : `para ${dateResponse}`}.\n\nDejame analizar tu disponibilidad...` }]);
    if (isAudioEnabled) await speakText('Excelente. Ahora voy a analizar tu calendario para crear las mejores recomendaciones de horarios.');
    setTimeout(async () => { if (connectedCalendar) { await analyze(connectedCalendar, undefined, studyApproach); return; } setShowCalendarModal(true); }, 1500);
    setIsProcessing(false);
  };

  const handleApproachSelection = async (approach: StudyApproach) => {
    const analyze = getAnalyzeCalendarAndSuggest();
    setShowApproachButtons(false); setStudyApproach(approach); setShowApproachModal(false); setIsProcessing(true);

    const dueDateCourses = assignedCourses.filter((c) => Boolean(c.dueDate));
    const resolvedTargetDate = dueDateCourses[0]?.dueDate ? new Date(dueDateCourses[0].dueDate) : calculateSuggestedDate(approach);
    const resolvedTargetDateText = resolvedTargetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    setTargetDate(resolvedTargetDateText); setHasAskedTargetDate(true);
    setSelectedDate(resolvedTargetDate); setCurrentMonth(normalizeMonth(resolvedTargetDate));

    let calendarProvider: CalendarProvider | null = connectedCalendar;
    if (!calendarProvider) {
      calendarProvider = await resolveConnectedCalendarFromServer();
      if (calendarProvider) setConnectedCalendar(calendarProvider);
    }

    const systemPrompt = buildApproachSystemPrompt(approach, calendarProvider, calendarSkipped, resolvedTargetDateText, assignedCourses);
    const approachSystemPrompt = buildApproachStudyPlannerPrompt(approach, assignedCourses, userContext);

    try {
      const response = await fetch('/api/study-planner-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: systemPrompt, conversationHistory: conversationHistory.slice(-5), systemPrompt: approachSystemPrompt, userName: userContext?.userName || undefined }) });
      if (response.ok) {
        const data = await response.json();
        if (data.response) setConversationHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
        if (isAudioEnabled) await speakText(calendarProvider ? `Excelente. Has seleccionado ${APPROACH_LABELS[approach]}. Veo que ya tienes tu calendario conectado. Voy a analizar tu agenda.` : 'Excelente. Ya registre tu ritmo de estudio. Ahora te ayudare a conectar el calendario para personalizar tu plan.');
      } else {
        const fallback = calendarProvider
          ? `Excelente eleccion. Has seleccionado **${APPROACH_LABELS[approach]}**. Veo que ya tienes tu calendario conectado. Voy a analizar tu agenda para crear el mejor plan de estudios.`
          : `Excelente eleccion. Has seleccionado **${APPROACH_LABELS[approach]}**. Para crear un plan personalizado, ¿te gustaria conectar tu calendario?`;
        setConversationHistory((prev) => [...prev, { role: 'assistant', content: fallback }]);
      }
    } catch (error) {
      console.error('Error obteniendo respuesta de SofLIA:', error);
      setConversationHistory((prev) => [...prev, { role: 'assistant', content: `Perfecto. Has seleccionado **${APPROACH_LABELS[approach]}**. ¿Te gustaria conectar tu calendario para personalizar tu plan?` }]);
    } finally {
      setIsProcessing(false);
    }

    if (calendarProvider) {
      setTimeout(async () => {
        try {
          await analyze(calendarProvider, resolvedTargetDateText || targetDate || undefined, approach);
        } catch (error) {
          console.error('Error en analyzeCalendarAndSuggest:', error);
          setIsProcessing(false);
          setConversationHistory((prev) => [...prev, { role: 'assistant', content: `Tu calendario de ${formatCalendarProvider(calendarProvider)} esta conectado, pero hubo un problema al analizarlo.\n\n¿Que dias de la semana prefieres estudiar? ¿Y en que horario te concentras mejor: **manana**, **tarde** o **noche**?` }]);
        }
      }, 2000);
      return;
    }

    if (!calendarSkipped) setTimeout(() => setShowCalendarModal(true), 3000);
  };

  return { handleApproachSelection, handleCalendarConfigSaveSuccess, handleCalendarConnect, handleCalendarModalCloseButtonClick, handleCalendarModalOverlayClose, handleDateMonthChange, handleDateSelection, handleTargetDateResponse };
}
