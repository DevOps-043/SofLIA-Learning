import { useState, useCallback, useRef, useEffect } from 'react';
import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';

export interface UseStudyPlannerLIAProps {
  userContext: any;
  assignedCourses: any[];
  availableCourses: any[];
  selectedCourseIds: string[];
  liaData: {
    isReady: boolean;
    lessons: any[];
    totalPending: number;
    courseProgress?: any[];
  };
  pendingLessonsRef: React.MutableRefObject<any[]>;
  connectedCalendar: 'google' | 'microsoft' | null;
  savedCalendarData: any;
  
  studyApproach: 'corto' | 'balance' | 'largo' | null;
  targetDate: string | null;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  showDateModal: boolean;
  
  isAudioEnabled: boolean;
  processingRef: React.MutableRefObject<boolean>;

  setStudyApproach: (a: 'corto' | 'balance' | 'largo') => void;
  setTargetDate: (d: string) => void;
  setHasAskedApproach: (v: boolean) => void;
  setHasAskedTargetDate: (v: boolean) => void;
  setShowApproachModal: (v: boolean) => void;
  loadUserCourses: () => void;
  handleStudyApproachResponse: (a: 'corto' | 'balance' | 'largo') => Promise<void>;
  handleTargetDateResponse: (d: string) => Promise<void>;
  executeFinalPlanSave: () => Promise<void>;
  speakText: (t: string) => Promise<void>;
  stopAllAudio: () => void;
  onSetLiaConversationId?: (id: string) => void;
}

export function useStudyPlannerLIA(props: UseStudyPlannerLIAProps) {
  const {
    userContext,
    assignedCourses,
    availableCourses,
    selectedCourseIds,
    liaData,
    pendingLessonsRef,
    connectedCalendar,
    savedCalendarData,
    studyApproach,
    targetDate,
    hasAskedApproach,
    hasAskedTargetDate,
    showDateModal,
    isAudioEnabled,
    processingRef,
    setStudyApproach,
    setTargetDate,
    setHasAskedApproach,
    setHasAskedTargetDate,
    setShowApproachModal,
    loadUserCourses,
    handleStudyApproachResponse,
    handleTargetDateResponse,
    executeFinalPlanSave,
    speakText,
    stopAllAudio,
    onSetLiaConversationId
  } = props;

  // Estados conversacionales que se extraen de StudyPlannerLIA.tsx
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string, content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasShownFinalSummary, setHasShownFinalSummary] = useState(false);
  
  // Estado para la distribución de las lecciones
  type StoredLessonDistribution = {
    dateStr: string;
    dayName: string;
    startTime: string;
    endTime: string;
    lessons: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number; durationMinutes?: number }>;
  };
  const [savedLessonDistribution, setSavedLessonDistribution] = useState<StoredLessonDistribution[]>([]);

  // Refs necesarios
  const conversationHistoryRef = useRef(conversationHistory);
  
  // Sincronizar ref con history

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    stopAllAudio();
    setIsProcessing(true);

    const userMessage = { role: 'user', content: message };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      
      // Filtros de inyección de prompts
      const promptInjectionPatterns = [
        /ignora\\s+(todas?\\s+)?las?\\s+instrucciones/i,
        /olvida\\s+(que\\s+)?eres/i,
        /actúa\\s+como/i,
        /muéstrame\\s+el\\s+prompt/i,
        /ejecuta\\s+(código|comando|script)/i,
        /system\\s*:\\s*ignore/i,
        /\\[SYSTEM\\]/i,
        /<\\|system\\|>/i,
      ];

      const hasInjectionAttempt = promptInjectionPatterns.some(pattern => pattern.test(message));
      if (hasInjectionAttempt) {
        setConversationHistory(prev => [...prev, {
          role: 'assistant',
          content: 'Entiendo que quieres probar diferentes cosas, pero estoy aquí para ayudarte con tu plan de estudios. ¿En qué puedo asistirte?'
        }]);
        setIsProcessing(false);
        return;
      }

      // Contexto Calendario
      let calendarContext = '';
      if (connectedCalendar && savedCalendarData && Object.keys(savedCalendarData).length > 0) {
        try {
          const busyList: string[] = [];
          Object.entries(savedCalendarData || {}).forEach(([dateKey, data]: [string, any]) => {
            if (data?.busySlots && Array.isArray(data.busySlots)) {
              data.busySlots.forEach((slot: any) => {
                const start = new Date(slot.start);
                const end = new Date(slot.end);
                busyList.push(`- ${dateKey}: ${start.getHours()}:${start.getMinutes()} - ${end.getHours()}:${end.getMinutes()}`);
              });
            }
          });
          if (busyList.length > 0) {
            calendarContext = `\\n\\nRESTRICCIONES CALENDARIO:\\n${busyList.join('\\n')}`;
          }
        } catch(e) {}
      }

      const isB2B = userContext?.userType === 'b2b';
      
      let pendingLessonsContext = '';
      if (isB2B) {
         if (pendingLessonsRef.current && pendingLessonsRef.current.length > 0) {
            pendingLessonsContext = pendingLessonsRef.current.map(l => `- ${l.lessonTitle} (${l.durationMinutes||15} min) - ${l.courseTitle}`).join('\\n');
         } else {
            pendingLessonsContext = 'No hay lecciones pendientes.';
         }
      } else {
         if (liaData?.lessons?.length > 0 && selectedCourseIds?.length > 0) {
            const filtered = liaData.lessons.filter((l:any) => selectedCourseIds.includes(l.courseId) || selectedCourseIds.includes(l.courses?.id));
            pendingLessonsContext = filtered.slice(0,10).map((l:any) => `- ${l.title} (${l.duration_minutes||15}m)`).join('\\n');
         }
      }

      const currentDateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const systemPrompt = generateStudyPlannerPrompt({
        userName: userContext?.userName || undefined,
        studyPlannerContextString: `TIPO DE USUARIO: ${isB2B ? 'B2B (Corporativo)' : 'B2C (Individual)'}
ENFOQUE DE ESTUDIO: ${studyApproach || 'No definido'}
FECHA LÍMITE GENERAL: ${targetDate || 'No definida'}
LECCIONES PENDIENTES:\\n${pendingLessonsContext}${calendarContext}`,
        currentDate: currentDateStr
      });

      const response = await fetch('/api/study-planner-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistoryRef.current.slice(-10),
          systemPrompt,
          userName: userContext?.userName || undefined
        }),
      });

      if (!response.ok) throw new Error('Error de comunicación con la API de SofLIA');

      const data = await response.json();
      let liaResponse = data.response;
      
      if (data.conversationId && onSetLiaConversationId) {
        onSetLiaConversationId(data.conversationId);
      }

      // Evitar que SofLIA escupa el prompt (bug de LLM)
      if (liaResponse.trim().startsWith('╔══') || liaResponse.trim().startsWith('█ IDENTIDAD') || liaResponse.trim().startsWith('PROMPT MAESTRO')) {
        liaResponse = '¡Perfecto! Vamos a continuar. ¿Qué más necesitas para tu plan de estudios?';
      }

      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);

      // Extraer lógicas de LIA desde las respuestas aquí
      
      if (liaResponse.includes('¿Qué cursos te gustaría incluir?')) {
        setTimeout(() => loadUserCourses(), 500);
      }
      
      // Parsear respuesta del Approach
      if (hasAskedApproach && !studyApproach) {
        const lower = message.toLowerCase();
        if (lower.includes('corto') || lower.includes('rápido')) {
          setStudyApproach('corto');
          await handleStudyApproachResponse('corto');
          return;
        } else if (lower.includes('balance') || lower.includes('equilibrado')) {
          setStudyApproach('balance');
          await handleStudyApproachResponse('balance');
          return;
        } else if (lower.includes('largo') || lower.includes('profundizar')) {
          setStudyApproach('largo');
          await handleStudyApproachResponse('largo');
          return;
        }
      }

      if (hasAskedTargetDate && !targetDate && studyApproach && !showDateModal) {
        const dateMatch = message.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
        if (dateMatch || message.toLowerCase().includes('mes')) {
          setTargetDate(message);
          await handleTargetDateResponse(message);
          return;
        }
      }

      const isUserConfirmation = message.toLowerCase().match(/^(s[íi]|ok|claro|perfecto|adelante|dale|va|seguro)/i);
      const liaConfirmsSaving = liaResponse.toLowerCase().match(/(guardad|guardar|xito|comenzar|dashboard|creado)/i);
      
      if (isUserConfirmation && liaConfirmsSaving && savedLessonDistribution.length > 0) {
        setTimeout(() => executeFinalPlanSave(), 2000);
      }
      
      if (isAudioEnabled) {
        await speakText(liaResponse);
      }
      
    } catch(err) {
      console.error(err);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema procesando tu mensaje.'}]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceQuestion = async (question: string) => {
    if (!question.trim()) return;
    if (processingRef.current) return;
    
    processingRef.current = true;
    
    try {
      await handleSendMessage(question);
    } finally {
      processingRef.current = false;
    }
  };

  return {
    conversationHistory,
    setConversationHistory,
    isProcessing,
    savedLessonDistribution,
    setSavedLessonDistribution,
    hasShownFinalSummary,
    setHasShownFinalSummary,
    handleSendMessage,
    handleVoiceQuestion,
    setIsProcessing
  };
}
