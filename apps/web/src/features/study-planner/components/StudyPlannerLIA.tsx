'use client';

import { useStudyPlannerLIA } from '../hooks/useStudyPlannerLIA';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronRight, Mic, MicOff, Send, Check, BookOpen, Loader2, Calendar, ExternalLink, Search, ChevronLeft, HelpCircle, GraduationCap, Zap, Scale, Clock, ArrowLeft, Settings } from 'lucide-react';
import { CalendarSelectionPanel } from './CalendarSelection';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { HolidayService } from '../../../lib/holidays';
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext';
import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSofLIAData } from '../hooks/useSofLIAData';
import { parseLiaResponseToSchedules } from '../services/plan-parser.service';
import { useVoiceEngine } from '../hooks/useVoiceEngine';
import { GoogleIcon, MicrosoftIcon } from './icons/PlannerIcons';
import { STUDY_PLANNER_STEPS } from '../constants/study-planner.constants';
import { getCalendarErrorMessage } from '../utils/calendar-error.util';
import { CalendarConnectionModal } from './study-planner-modals/CalendarConnectionModal';
import { CourseSelectorModal } from './study-planner-modals/CourseSelectorModal';
import { StudyApproachModal } from './study-planner-modals/StudyApproachModal';
import { EstimatedDateModal } from './study-planner-modals/EstimatedDateModal';
import { ChatInputArea } from './study-planner-ui/ChatInputArea';
import { WelcomeTourOverlay } from './study-planner-ui/WelcomeTourOverlay';
import { StudyPlannerHeader } from './study-planner-ui/StudyPlannerHeader';
import { SofLIAMessageFormatter } from './study-planner-ui/SofLIAMessageFormatter';
import { usePlanPersistence } from '../hooks/usePlanPersistence';
// import Joyride from 'react-joyride';
// import { useStudyPlannerJoyride } from '../../tours/hooks/useStudyPlannerJoyride';

export function StudyPlannerSofLIA({ onBack }: { onBack?: () => void }) {

  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  // Joyride integration protected (commented out due to webpack error)
  // const { joyrideProps, restartTour, isRunning } = useStudyPlannerJoyride();
  const joyrideProps = {}; const restartTour = () => { }; const isRunning = false;
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // const { currentTour } = useNextStep();
  // const { restartTour } = useStudyPlannerTour();
  const { styles, loading: loadingStyles } = useOrganizationStylesContext();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Efecto para aplicar estilos de organización
  useEffect(() => {
    if (styles?.panel && typeof document !== 'undefined') {
      const root = document.documentElement;
      const panelStyles = styles.panel;

      // Aplicar variables CSS personalizadas
      if (panelStyles.primary_button_color) root.style.setProperty('--color-primary', panelStyles.primary_button_color);
      if (panelStyles.secondary_button_color) root.style.setProperty('--color-secondary', panelStyles.secondary_button_color);
      if (panelStyles.accent_color) root.style.setProperty('--color-accent', panelStyles.accent_color);
      if (panelStyles.sidebar_background) root.style.setProperty('--color-bg-dark', panelStyles.sidebar_background);
      if (panelStyles.card_background) root.style.setProperty('--color-bg-card', panelStyles.card_background);
      if (panelStyles.text_color) root.style.setProperty('--color-text-primary', panelStyles.text_color);
    }
  }, [styles]);

  // Estado para mostrar la interfaz de conversación después del modal
  // Iniciar directamente con la conversación visible, sin mostrar el modal automáticamente
  const [showConversation, setShowConversation] = useState(true);
  const [userMessage, setUserMessage] = useState('');

  // Estados para selector de cursos
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // Estados para hover de botones del header
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string, title: string, category: string, progress: number }>>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Estados para modal de calendario
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [connectedCalendar, setConnectedCalendar] = useState<'google' | 'microsoft' | null>(null);
  const [calendarSkipped, setCalendarSkipped] = useState(false); // Indica si el usuario rechazó explícitamente conectar calendario
  const [showCalendarConfig, setShowCalendarConfig] = useState(false);
  const [hasConfiguredCalendars, setHasConfiguredCalendars] = useState(false);

  // Manejar conexión de calendario (Google/Microsoft)
  const handleCalendarConnect = async (provider: 'google' | 'microsoft') => {
    try {
      setIsConnectingCalendar(true);
      // Llamar a la API para obtener URL de autorización
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexión');
      }

      const data = await response.json();

      if (data.success && data.data?.authUrl) {
        // Redirigir a URL de autorización
        window.location.href = data.data.authUrl;
      }
      setIsConnectingCalendar(false);
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setIsConnectingCalendar(false);
    }
  };


  // Estados para configuración de estudio
  // ? INTERPRETACIÓN A: Los modos controlan VELOCIDAD DE COMPLETACIÓN
  // - 'corto' = terminar RÁPIDO ? sesiones largas (60-90 min), menos días
  // - 'balance' = equilibrado ? sesiones medias (45-60 min)
  // - 'largo' = sin prisa ? sesiones cortas (20-35 min), más días
  const [studyApproach, setStudyApproach] = useState<'corto' | 'balance' | 'largo' | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [hasAskedApproach, setHasAskedApproach] = useState(false);
  const [hasAskedTargetDate, setHasAskedTargetDate] = useState(false);
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showApproachButtons, setShowApproachButtons] = useState(false); // ? Botones inline de ritmo de estudio
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Inicializar currentMonth con el día 1 del mes actual para evitar problemas
  // ? CORRECCIÓN: Usar null inicialmente y establecer en useEffect para evitar problemas de hidratación
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);

  // Función helper para normalizar currentMonth siempre al día 1
  const setCurrentMonthNormalized = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    setCurrentMonth(normalized);
  };

  // Estado para guardar la distribución de lecciones para el resumen final
  type StoredLessonDistribution = {
    dateStr: string;
    dayName: string;
    startTime: string;
    endTime: string;
    lessons: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number; durationMinutes?: number }>;
  };

  const [savedTargetDate, setSavedTargetDate] = useState<string | null>(null);
  const [savedTotalLessons, setSavedTotalLessons] = useState<number>(0);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null); // ? Guardar planId cuando se guarda el plan




  // Estado para guardar los datos del calendario analizado (para validar conflictos)
  const [savedCalendarData, setSavedCalendarData] = useState<Record<string, {
    busySlots: Array<{ start: Date; end: Date }>;
    events: any[];
  }> | null>(null);

  // Estado para guardar el userId actual (para detectar cambios de usuario)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estado para guardar el contexto del usuario (perfil profesional) - Solo B2B
  const [userContext, setUserContext] = useState<{
    userType: 'b2b' | null;
    userName: string | null; // ? NUEVO: Nombre real del usuario
    rol: string | null;
    area: string | null;
    nivel: string | null;
    tamanoEmpresa: string | null;
    organizationName: string | null;
    minEmpleados: number | null;
    maxEmpleados: number | null;
    workTeams: Array<{ name: string; role: string }> | null;
  } | null>(null);

  // Estado para cursos asignados (B2B) - Todos los cursos, con o sin fecha límite
  const [assignedCourses, setAssignedCourses] = useState<Array<{
    courseId: string;
    title: string;
    dueDate: string | null;
  }>>([]);

  // ? NUEVO: Estado para lecciones pendientes con nombres reales (para mostrar en el plan)
  const [pendingLessonsWithNames, setPendingLessonsWithNames] = useState<Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    moduleOrderIndex: number;
    lessonOrderIndex: number;
    durationMinutes: number;
  }>>([]);

  // ✅ Estado para tracking de analytics de SofLIA
  const [liaConversationId, setLiaConversationId] = useState<string | null>(null);

  // ✅ NUEVO: Hook para datos de SofLIA (lecciones pendientes desde BD)
  const liaData = useSofLIAData();

  // 1. Crear Refs para las funciones que se definen más abajo (para evitar circularidad)
  const pendingLessonsRef = useRef<Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    moduleOrderIndex: number;
    lessonOrderIndex: number;
    durationMinutes: number;
  }>>([]);
  const executeFinalPlanSaveRef = useRef<() => Promise<void>>(async () => {});
  const loadUserCoursesRef = useRef<() => void>(() => {});
  const handleStudyApproachResponseRef = useRef<(a: string) => Promise<void>>(async () => {});
  const handleTargetDateResponseRef = useRef<(d: string) => Promise<void>>(async () => {});

  // 2. Traer la voz PRIMERO
  const voice = useVoiceEngine({
    onTranscriptReady: (text) => {
      // Usamos un elemento oculto para invocar handleVoiceQuestion debido al hoisting de hooks
      const handlerBtn = document.getElementById('voice-handler-ref');
      if (handlerBtn) {
        handlerBtn.setAttribute('data-text', text);
        handlerBtn.click();
      }
    },
  });
  
  const { isListening, isSpeaking, isAudioEnabled, transcript } = voice;
  const speakText = voice.speak;
  const stopAllAudio = voice.stopAll;
  const toggleListening = voice.toggleListening;
  const processingRef = voice.processingRef;

  // 3. Inyectar el hook de lógica AI
  const {
    conversationHistory,
    setConversationHistory,
    isProcessing,
    setIsProcessing,
    savedLessonDistribution,
    setSavedLessonDistribution,
    hasShownFinalSummary,
    setHasShownFinalSummary,
    handleSendMessage,
    handleVoiceQuestion
  } = useStudyPlannerLIA({
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
    loadUserCourses: () => loadUserCoursesRef.current(),
    handleStudyApproachResponse: (a) => handleStudyApproachResponseRef.current(a),
    handleTargetDateResponse: (d) => handleTargetDateResponseRef.current(d),
    executeFinalPlanSave: () => executeFinalPlanSaveRef.current(),
    speakText,
    stopAllAudio,
    onSetLiaConversationId: setLiaConversationId
  });

  // 4. Inyectar el hook de persistencia
  const {
    isInsertingEvents,
    insertProgress,
    insertResult,
    showInsertConfirmModal,
    setShowInsertConfirmModal,
    handleInsertEventsToCalendar,
    executeFinalPlanSave: executeFinalPlanSaveActual
  } = usePlanPersistence({
    savedLessonDistribution,
    studyApproach,
    targetDate,
    userContext,
    availableCourses,
    selectedCourseIds,
    connectedCalendar,
    assignedCourses,
    isAudioEnabled,
    speakText,
    setConversationHistory,
    setIsProcessing,
    setConnectedCalendar,
    setShowCalendarModal,
    savedPlanId,
    setSavedPlanId
  });

  // 5. Sincronizar Refs
  useEffect(() => {
    executeFinalPlanSaveRef.current = executeFinalPlanSaveActual;
  }, [executeFinalPlanSaveActual]);

  // ===== FIN DE INYECCIÓN CORREGIDA =====

  // Estados para recuperación de sesión
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedSessionDate, setSavedSessionDate] = useState<string | null>(null);

  // Clave para localStorage (se combina con currentUserId cuando está disponible)
  const getStorageKey = (userId: string) => `lia_planner_session_v1_${userId}`;

  // Cargar sesión guardada al iniciar (cuando tenemos userId)
  useEffect(() => {
    if (currentUserId && typeof window !== 'undefined') {
      try {
        const key = getStorageKey(currentUserId);
        const savedData = localStorage.getItem(key);

        if (savedData) {
          const session = JSON.parse(savedData);
          // Verificar si la sesión tiene contenido relevante y es reciente (menos de 24h)
          const sessionTime = new Date(session.timestamp).getTime();
          const now = Date.now();
          const isRecent = (now - sessionTime) < 24 * 60 * 60 * 1000;

          if (isRecent && (session.conversationHistory?.length > 0 || session.savedLessonDistribution?.length > 0)) {
            console.log('?? Sesión guardada detectada:', new Date(session.timestamp).toLocaleString());
            setSavedSessionDate(new Date(session.timestamp).toLocaleString('es-ES', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }));

            // Si el modal principal ya se mostró (showConversation=true), mostrar el prompt
            if (showConversation) {
              setShowResumePrompt(true);
            }
          }
        }
      } catch (e) {
        console.error('Error leyendo sesión guardada:', e);
      }
    }
  }, [currentUserId, showConversation]);

  // Guardar sesión automáticamente cuando cambian datos clave
  useEffect(() => {
    if (currentUserId && showConversation && !showResumePrompt) {
      // Solo guardar si hay algo relevante (historial no vacío)
      if (conversationHistory.length > 0 || savedLessonDistribution.length > 0) {
        const key = getStorageKey(currentUserId);
        const sessionData = {
          timestamp: new Date().toISOString(),
          conversationHistory,
          savedLessonDistribution,
          currentStep,
          studyApproach,
          targetDate,
          hasShownFinalSummary
        };
        localStorage.setItem(key, JSON.stringify(sessionData));
      }
    }
  }, [currentUserId, showConversation, showResumePrompt, conversationHistory, savedLessonDistribution, currentStep, studyApproach, targetDate, hasShownFinalSummary]);

  // Manejadores para recuperación
  const handleResumeSession = () => {
    if (currentUserId) {
      try {
        const key = getStorageKey(currentUserId);
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const session = JSON.parse(savedData);

          // Restaurar estados
          if (session.conversationHistory) setConversationHistory(session.conversationHistory);
          if (session.savedLessonDistribution) setSavedLessonDistribution(session.savedLessonDistribution);
          if (session.currentStep) setCurrentStep(session.currentStep);
          if (session.studyApproach) setStudyApproach(session.studyApproach);
          if (session.targetDate) setTargetDate(session.targetDate);
          if (session.hasShownFinalSummary) setHasShownFinalSummary(session.hasShownFinalSummary);

          // Añadir mensaje de sistema indicando restauración
          setConversationHistory(prev => [...prev, {
            role: 'system',
            content: '?? [SISTEMA] Sesión anterior restaurada exitosamente. Puedes continuar donde lo dejaste.'
          }]);

          console.log('? Sesión restaurada');
        }
      } catch (e) {
        console.error('Error restaurando sesión:', e);
      }
    }
    setShowResumePrompt(false);
  };

  const handleDiscardSession = () => {
    if (currentUserId) {
      const key = getStorageKey(currentUserId);
      localStorage.removeItem(key);
      console.log('ðŸ—‘ï¸ Sesión anterior descartada');
    }
    setShowResumePrompt(false);
    // El flujo normal continúa (mensaje de bienvenida, etc.)
  };

  // 3. Callback handlers for useStudyPlannerLIA and UI
  const loadUserCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch('/api/my-courses');
      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || data || [];
        setAvailableCourses(courses.map((c: any) => ({
          id: c.course_id || c.id,
          title: c.course_title || c.title || c.courses?.title || 'Curso sin nombre',
          category: c.course_category || c.category || c.courses?.category || 'General',
          progress: c.progress_percentage || c.progress || 0
        })));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoadingCourses(false);
      setShowCourseSelector(true);
    }
  };

  const handleStudyApproachResponse = async (approach: 'corto' | 'balance' | 'largo') => {
    setStudyApproach(approach);
    setHasAskedApproach(true);
  };

  const handleTargetDateResponse = async (date: string) => {
    setTargetDate(date);
    setHasAskedTargetDate(true);
  };

  const skipCalendarConnection = () => {
    setCalendarSkipped(true);
    setShowCalendarModal(false);
    setConversationHistory(prev => [...prev, {
      role: 'assistant',
      content: 'No hay problema. Continuaremos sin sincronizar con tu calendario. ¿Qué cursos te gustaría incluir?'
    }]);
    loadUserCourses();
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const confirmCourseSelection = () => {
    setShowCourseSelector(false);
    const selectedCourses = availableCourses.filter(c => selectedCourseIds.includes(c.id));
    const courseNames = selectedCourses.map(c => c.title).join(', ');
    handleSendMessage(selectedCourses.length > 0 ? `He seleccionado estos cursos: ${courseNames}` : 'No he seleccionado ningún curso');
  };

  const handleApproachSelection = (approach: 'corto' | 'balance' | 'largo') => {
    setStudyApproach(approach);
    setShowApproachModal(false);
    handleSendMessage(`He elegido el ritmo: ${approach === 'corto' ? 'Rápido' : approach === 'balance' ? 'Balanceado' : 'Sin prisa'}`);
  };

  const handleDateSelection = (date: Date) => {
    const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    setSelectedDate(date);
    setShowDateModal(false);
    handleSendMessage(`Mi fecha objetivo es el ${formatted}`);
  };

  // Tour handlers
  const handleNext = () => { stopAllAudio(); const nextStep = currentStep + 1; if (nextStep < STUDY_PLANNER_STEPS.length) { setCurrentStep(nextStep); speakText(STUDY_PLANNER_STEPS[nextStep].speech); } else { handleComplete(); } };
  const handlePrevious = () => { stopAllAudio(); if (currentStep > 0) { const prevStep = currentStep - 1; setCurrentStep(prevStep); speakText(STUDY_PLANNER_STEPS[prevStep].speech); } };
  const handleSkip = () => { stopAllAudio(); setIsVisible(false); setShowConversation(true); loadUserCourses(); };
  const handleComplete = () => { stopAllAudio(); setIsVisible(false); setShowConversation(true); };

  const toggleAudio = () => { voice.toggleAudio(STUDY_PLANNER_STEPS[currentStep].speech); };

  // Sync Refs with hook handlers
  useEffect(() => {
    executeFinalPlanSaveRef.current = executeFinalPlanSaveActual;
    loadUserCoursesRef.current = loadUserCourses;
    handleStudyApproachResponseRef.current = handleStudyApproachResponse;
    handleTargetDateResponseRef.current = handleTargetDateResponse;
  }, [executeFinalPlanSaveActual]);


  // 4. User context and calendar initialization
  useEffect(() => {
    const checkUserAndCalendarStatus = async () => {
      try {
        const userResponse = await fetch('/api/study-planner/user-context');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userId = userData.data?.userId;

          if (currentUserId && userId && currentUserId !== userId) {
            setConnectedCalendar(null);
            setUserContext(null);
            setConversationHistory([]);
            setShowConversation(true);
            setIsVisible(false);
            setHasShownFinalSummary(false);
            setSavedLessonDistribution([]);
          }

          if (userId) {
            setCurrentUserId(userId);
          }

          if (userData.success && userData.data) {
            const userProfile = userData.data;
            const workTeams = userProfile.workTeams?.map((team: any) => ({
              name: team.name || 'Equipo',
              role: team.role || 'member'
            })) || null;

            setUserContext({
              userType: 'b2b',
              userName: userProfile.user?.firstName || userProfile.user?.displayName || userProfile.user?.username || null,
              rol: userProfile.professionalProfile?.rol?.nombre || null,
              area: userProfile.professionalProfile?.area?.nombre || null,
              nivel: userProfile.professionalProfile?.nivel?.nombre || null,
              tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
              organizationName: userProfile.organization?.name || null,
              minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
              maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
              workTeams: workTeams,
            });

            if (userProfile.courses && Array.isArray(userProfile.courses)) {
              const allAssignedCourses = userProfile.courses
                .map((course: any) => ({
                  courseId: course.courseId || course.course?.id || course.id,
                  title: course.course?.title || course.title || 'Curso',
                  dueDate: course.dueDate || course.course?.dueDate || null,
                }))
                .sort((a: any, b: any) => {
                  if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  if (a.dueDate && !b.dueDate) return -1;
                  if (!a.dueDate && b.dueDate) return 1;
                  return 0;
                });

              setAssignedCourses(allAssignedCourses);
              if (allAssignedCourses.length > 0) {
                const courseIds = allAssignedCourses.map((c: any) => c.courseId).filter(Boolean);
                setSelectedCourseIds(courseIds);
              }
            }
          }
        }

        const calendarResponse = await fetch('/api/study-planner/calendar/status');
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          if (data.isConnected && data.provider) {
            setConnectedCalendar(data.provider as 'google' | 'microsoft');
            try {
              const selResponse = await fetch('/api/study-planner/calendar/selection');
              if (selResponse.ok) {
                const selData = await selResponse.json();
                if (selData.success && selData.data?.selectedCalendarIds?.length > 0) {
                  setHasConfiguredCalendars(true);
                }
              }
            } catch (e) {
              console.error('Error fetching calendar selection:', e);
            }
          } else {
            setConnectedCalendar(null);
          }
        }
      } catch (error) {
        console.error('Error verifying user and calendar status:', error);
      }
    };

    checkUserAndCalendarStatus();
  }, [currentUserId]);

  useEffect(() => {
    if (currentMonth === null) {
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, [currentMonth]);

  return (
    <>
      <WelcomeTourOverlay
        isVisible={isVisible}
        isMobile={isMobile}
        isSpeaking={isSpeaking}
        isAudioEnabled={isAudioEnabled}
        isListening={isListening}
        isProcessing={isProcessing}
        currentStep={currentStep}
        showResumePrompt={showResumePrompt}
        savedSessionDate={savedSessionDate}
        onToggleAudio={toggleAudio}
        onSkip={handleSkip}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onComplete={handleComplete}
        onToggleListening={toggleListening}
        onDiscardSession={handleDiscardSession}
        onResumeSession={handleResumeSession}
      />


      {/* Interfaz de conversación con LIA */}
      {
        showConversation && (
          <div className="h-[100dvh] bg-white dark:bg-[#0F1419] flex flex-col overflow-hidden supports-[height:100dvh]:h-[100dvh]" suppressHydrationWarning>
            {/* Header */}
            <StudyPlannerHeader
              connectedCalendar={connectedCalendar}
              isProcessing={isProcessing}
              showCalendarModal={showCalendarModal}
              isMobile={isMobile}
              hoveredButton={hoveredButton}
              isAudioEnabled={isAudioEnabled}
              onBack={() => {
                const orgSlug = user?.organization?.slug || params?.orgSlug;
                if (orgSlug) {
                  router.push(`/${orgSlug}/business-user/dashboard`);
                } else {
                  router.back();
                }
              }}
              onOpenCalendarModal={() => setShowCalendarModal(true)}
              onSetHoveredButton={setHoveredButton}
              onRestartTour={restartTour}
              onHelp={() => handleSendMessage('¿Cómo funciona?')}
              onToggleAudio={toggleAudio}
            />

            {/* Ãrea de mensajes */}
            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 min-h-0 bg-[#F8F9FA] dark:bg-[#0F1419]/50">
              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
                {/* Welcome message removed as per user request */}

                {conversationHistory.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                      delay: idx * 0.05
                    }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group max-w-full`}
                  >
                    <div className={`flex items-end gap-2 sm:gap-2.5 max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.role === 'assistant' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: idx * 0.05 + 0.1,
                            type: 'spring',
                            stiffness: 200,
                            damping: 15
                          }}
                          className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/40 flex-shrink-0 shadow-lg shadow-[#0A2540]/20 dark:shadow-[#00D4B3]/20 hidden sm:block"
                        >
                          <Image
                            src="/lia-avatar.png"
                            alt="LIA"
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </motion.div>
                      )}

                      {/* Avatar pequeño para móvil */}
                      {msg.role === 'assistant' && (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#0A2540]/30 dark:border-[#00D4B3]/40 flex-shrink-0 sm:hidden self-start mt-1">
                          <Image
                            src="/lia-avatar.png"
                            alt="LIA"
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: idx * 0.05 + 0.15,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }}
                        className={`relative ${msg.role === 'user'
                          ? 'bg-[#0A2540] text-white'
                          : 'bg-[#FFFFFF] dark:bg-[#1E2329] text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30'
                          } px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-[18px] sm:rounded-[22px] shadow-sm ${msg.role === 'user'
                            ? 'shadow-[#0A2540]/25 rounded-br-[6px]'
                            : 'shadow-sm rounded-bl-[6px]'
                          } overflow-hidden max-w-full`}
                      >


                        {/* Contenido del mensaje */}
                        <div className="relative z-10 break-words">
                          {msg.role === 'assistant' ? (
                            <SofLIAMessageFormatter text={msg.content} />
                          ) : (
                            <p className="font-body text-[14px] sm:text-[16px] leading-[1.6] sm:leading-[1.75] font-medium whitespace-pre-wrap text-white tracking-wide">{msg.content}</p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* ? NUEVO: Botones inline de selección de ritmo de estudio (con avatar de LIA) */}
                {showApproachButtons && !studyApproach && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
                    className="flex justify-start mt-2 group"
                  >
                    <div className="flex items-end gap-2 sm:gap-2.5 max-w-[85%] sm:max-w-[80%]">
                      {/* Avatar de LIA - Desktop */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                        className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/40 flex-shrink-0 shadow-lg shadow-[#0A2540]/20 dark:shadow-[#00D4B3]/20 hidden sm:block"
                      >
                        <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
                      </motion.div>

                      {/* Avatar de LIA - Mobile */}
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#0A2540]/30 dark:border-[#00D4B3]/40 flex-shrink-0 sm:hidden self-start mt-1">
                        <Image src="/lia-avatar.png" alt="LIA" fill sizes="24px" className="object-cover" />
                      </div>

                      {/* Contenedor de botones estilo mensaje de LIA */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative bg-[#FFFFFF] dark:bg-[#1E2329] text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-[18px] sm:rounded-[22px] shadow-sm rounded-bl-[6px] overflow-hidden"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                          <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                            ¿Qué ritmo de estudio prefieres?
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {/* Botón Rápido - Terminar pronto con sesiones largas */}
                          <motion.button
                            onClick={() => handleApproachSelection('corto')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 min-w-[85px] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#0A2540]/5 dark:hover:bg-[#0A2540]/10 transition-all"
                          >
                            <div className="p-2 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                              <Zap className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                            </div>
                            <span className="text-xs font-semibold text-[#0A2540] dark:text-white">Rápido</span>
                            <span className="text-[10px] text-[#6C757D] dark:text-gray-400 text-center">60-90 min</span>
                          </motion.button>

                          {/* Botón Balance */}
                          <motion.button
                            onClick={() => handleApproachSelection('balance')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 min-w-[85px] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/30 bg-[#0A2540]/5 dark:bg-[#0A2540]/10 hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/20 transition-all"
                          >
                            <div className="p-2 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                              <Scale className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                            </div>
                            <span className="text-xs font-semibold text-[#0A2540] dark:text-white">Balance</span>
                            <span className="text-[10px] text-[#6C757D] dark:text-gray-400 text-center">45-60 min</span>
                          </motion.button>

                          {/* Botón Relajado - Sin prisa con sesiones cortas */}
                          <motion.button
                            onClick={() => handleApproachSelection('largo')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 min-w-[85px] flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#0A2540]/5 dark:hover:bg-[#0A2540]/10 transition-all"
                          >
                            <div className="p-2 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                              <Clock className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                            </div>
                            <span className="text-xs font-semibold text-[#0A2540] dark:text-white">Sin prisa</span>
                            <span className="text-[10px] text-[#6C757D] dark:text-gray-400 text-center">20-35 min</span>
                          </motion.button>
                        </div>
                        <p className="text-[10px] text-[#6C757D] dark:text-gray-400 text-center mt-3">
                          Selecciona para continuar
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Indicador de procesamiento */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-start group"
                  >
                    <div className="flex items-end gap-2 sm:gap-2.5">
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/40 shadow-lg flex-shrink-0">
                        <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
                      </div>
                      <motion.div
                        className="relative bg-[#FFFFFF] dark:bg-[#1E2329] px-4 py-3 sm:px-5 sm:py-3.5 rounded-[20px] shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-bl-[6px] overflow-hidden"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                      >
                        {/* Puntos animados mejorados */}
                        <div className="relative z-10 flex gap-1.5 items-center">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00D4B3] rounded-full shadow-lg"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00D4B3] rounded-full shadow-lg"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00D4B3] rounded-full shadow-lg"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Spacer invisible para asegurar que el último mensaje no quede tapado por el input */}
                <div className="h-2 sm:h-4"></div>


                {/* Indicador de escucha */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center"
                  >
                    <div className="bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981]/30 px-4 py-2 rounded-full flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 bg-[#10B981] rounded-full"
                      />
                      <span className="text-[#10B981] text-sm">Escuchando...</span>
                    </div>
                  </motion.div>
                )}

                {/* Selector de cursos */}
                <CourseSelectorModal
                  show={showCourseSelector}
                  availableCourses={availableCourses}
                  selectedCourseIds={selectedCourseIds}
                  courseSearchQuery={courseSearchQuery}
                  isLoadingCourses={isLoadingCourses}
                  onSearchChange={setCourseSearchQuery}
                  onToggleCourse={toggleCourseSelection}
                  onConfirm={confirmCourseSelection}
                />

                {showCalendarModal && (
                  <CalendarConnectionModal
                    userType={userContext?.userType ?? undefined}
                    connectedCalendar={connectedCalendar}
                    isConnectingCalendar={isConnectingCalendar}
                    onConnect={handleCalendarConnect}
                    onSkip={skipCalendarConnection}
                    onClose={() => {
                      if (connectedCalendar) {
                        setShowCalendarModal(false);
                        const calendarType = connectedCalendar === 'google' ? 'Google Calendar' : 'Microsoft Outlook';
                        setConversationHistory(prev => [...prev, {
                          role: 'assistant',
                          content: `¡Perfecto! Tu calendario de ${calendarType} está conectado. Continuemos con tu planificación.`
                        }]);
                      } else {
                        setShowCalendarModal(false);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Modal de configuración de calendarios */}
            <AnimatePresence>
              {showCalendarConfig && connectedCalendar && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    onClick={() => setShowCalendarConfig(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
                  >
                    <motion.div className="relative bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <div>
                          <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Configurar calendarios</h3>
                          <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-0.5">
                            Selecciona qué calendarios considerar para tu disponibilidad
                          </p>
                        </div>
                        <motion.button
                          onClick={() => setShowCalendarConfig(false)}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-all"
                        >
                          <X size={18} />
                        </motion.button>
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <CalendarSelectionPanel
                          provider={connectedCalendar}
                          onSaveSuccess={() => {
                            setHasConfiguredCalendars(true);
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <StudyApproachModal
              show={showApproachModal}
              studyApproach={studyApproach}
              onSelect={handleApproachSelection}
            />

            <EstimatedDateModal
              show={showDateModal}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={setCurrentMonthNormalized}
              onDateSelect={setSelectedDate}
              onConfirm={handleDateSelection}
            />

            <ChatInputArea
              userMessage={userMessage}
              isMobile={isMobile}
              isProcessing={isProcessing}
              isListening={isListening}
              showApproachButtons={showApproachButtons}
              studyApproach={studyApproach}
              onMessageChange={setUserMessage}
              onSendMessage={(msg) => { handleSendMessage(msg); setUserMessage(''); }}
              onToggleListening={toggleListening}
            />
          </div >
        )
      }
      {/* {isMounted && <Joyride {...joyrideProps} />} */}
    </>
  );
}

