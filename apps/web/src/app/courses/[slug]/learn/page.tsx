"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Play,
  BookOpen,
  FileText,
  Activity,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowLeft,
  ScrollText,
  HelpCircle,
  MessageCircle,
  Save,
  FileDown,
  User,
  Copy,
  Check,
  Reply,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  Mic,
  MicOff,
  AlertCircle,
  XCircle,
  Info,
  History,
  Edit2,
  MoreVertical,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Brain,
  Palette,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import { WorkshopLearningProvider } from "../../../../components/WorkshopLearningProvider";
import { CourseRatingModal } from "../../../../features/courses/components/CourseRatingModal";
import { CourseLia } from "../../../../features/courses/components/CourseLia";
import {
  ActivitiesContent,
  CourseSidebarPanel,
  DeleteNoteConfirmModal,
  QuestionsSection,
  SummaryContent,
  TranscriptContent,
  VideoContent,
} from "../../../../features/courses/components/learn";
import { useLiaCourse } from "../../../../features/courses/context/LiaCourseContext";
import { CourseRatingService } from "../../../../features/courses/services/course-rating.service";
import { ConfirmationModal } from "../../../../core/components/ConfirmationModal";
import { useTranslation } from "react-i18next";
import { VideoPlayerProvider } from "./VideoPlayerContext";
import { useCourseLearnTour } from "../../../../features/tours/hooks/useCourseLearnTour";
import Joyride from "react-joyride";
import { CourseAccessGuard } from "../../../../features/courses/components/CourseAccessGuard";
import { useLearnPageLogic } from "../../../../features/courses/hooks/useLearnPageLogic";

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104;

// NotesModal: Importar siempre NotesModalWithLibraries (editor rico con toolbar)
// IMPORTANTE: dynamic() debe estar al nivel de módulo, NO dentro de useMemo/hooks
const NotesModal = dynamic(
  () =>
    import("../../../../core/components/NotesModal").then((mod) => ({
      default: mod.NotesModalWithLibraries,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        Cargando notas...
      </div>
    ),
    ssr: false,
  }
);

// Componente del botón de LIA para la barra de navegación móvil
function LiaMobileButton() {
  const { isOpen, toggleLia } = useLiaCourse();

  return (
    <button
      onClick={toggleLia}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${isOpen
        ? "bg-[#00D4B3]/20 text-[#00D4B3]"
        : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
        }`}
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-current">
        <img
          src="/lia-avatar.png"
          alt="SofLIA"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-xs font-medium">SofLIA</span>
      {/* Indicador de activo */}
      <div className="absolute top-1 right-2 w-2 h-2 bg-[#22c55e] rounded-full border border-white dark:border-[#1E2329]" />
    </button>
  );
}

export default function CourseLearnPage() {
  const {
    // Routing
    slug,
    router,

    // Auth & styles
    user,
    colors,

    // i18n
    t,
    ready,

    // Hydration
    mounted,

    // Course data
    course,
    modules,
    currentLesson,
    workshopMetadata,
    loading,
    courseProgress,

    // LIA context
    liaTranscript,
    liaSummary,
    isLiaOpen,
    openLia,
    handleSaveLiaNote,
    getLessonContext,
    sendLiaMessage,

    // i18n extended
    selectedLang,

    // Tabs
    activeTab,
    setActiveTab,
    handleTabChange,

    // Mobile / layout
    isMobile,
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
    swipeRef,

    // Sidebar state
    closeLeftPanel,
    expandedLessons,
    expandedModules,
    isLeftPanelOpen,
    isMaterialCollapsed,
    isNotesCollapsed,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    loadLessonActivitiesAndMaterials,
    openContentSection,
    openLeftPanel,
    openNotesSection,
    toggleLessonExpand,
    toggleMaterialCollapsed,
    toggleModuleExpand,
    toggleNotesCollapsed,

    // Notes management
    addNoteToLocalState,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    editingNote,
    handleDeleteNote,
    handleSaveNote,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    notesStats,
    openEditNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,

    // Lesson navigation
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
    canCompleteLesson,
    markLessonAsCompleted,

    // Modals
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
    validationModal,
    setValidationModal,

    // Activity prompts
    handlePromptsChange,

    // User behavior tracking
    analyzeUserBehavior,

    // Tour
    joyrideComponentProps,
    isJoyrideMounted,
  } = useLearnPageLogic();

  // Tabs config — icon components resolved here to keep JSX clean
  const tabs = [
    { id: "video" as const, label: t("tabs.video"), icon: Play },
    { id: "transcript" as const, label: t("tabs.transcript"), icon: ScrollText },
    { id: "summary" as const, label: t("tabs.summary"), icon: FileText },
    { id: "activities" as const, label: t("tabs.activities"), icon: Activity },
    { id: "questions" as const, label: t("tabs.questions"), icon: MessageCircle },
  ];

  // Mostrar loading mientras i18n no está listo o mientras se cargan los datos
  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
          <p
            className="text-[#0A2540] dark:text-white text-lg"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {mounted && ready ? t("loading.general") : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-[#0A2540] dark:text-white mb-4"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
          >
            {t("errors.courseNotFound")}
          </h1>
          <p
            className="text-[#6C757D] dark:text-white/80 mb-8"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {t("errors.courseNotFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-lg transition-colors"
          >
            {t("navigation.backToCourses")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayerProvider>
      <WorkshopLearningProvider
        workshopId={course?.id || course?.course_id || slug}
        activityId={currentLesson?.lesson_id || "no-lesson"}
        enabled={!!course && !!currentLesson}
        suppressDisplay={activeTab === "video"}
        checkInterval={15000}
        assistantPosition="bottom-right"
        assistantCompact={false}
        onDifficultyDetected={(analysis) => {}}
        onHelpAccepted={async (analysis) => {
          // Abrir el panel de LIA (panel derecho)
          openLia();

          // Generar mensaje personalizado basado en los patrones detectados
          const generatePersonalizedMessage = (patterns: any[]) => {
            const highSeverityPatterns = patterns.filter(
              (p) => p.severity === "high"
            );
            const mediumSeverityPatterns = patterns.filter(
              (p) => p.severity === "medium"
            );

            const primaryPattern =
              highSeverityPatterns[0] || mediumSeverityPatterns[0] || patterns[0];

            if (!primaryPattern) {
              return "Necesito ayuda con esta lección";
            }

            const messageMap: Record<string, string> = {
              inactivity: "Llevo varios minutos sin poder avanzar en esta lección",
              excessive_scroll:
                "Estoy buscando información en la lección pero no encuentro lo que necesito",
              failed_attempts:
                "He intentado completar la actividad varias veces pero no lo logro",
              frequent_deletion:
                "Estoy teniendo problemas para escribir la respuesta correcta",
              repetitive_cycles:
                "Estoy confundido y no sé cómo continuar con esta lección",
              erroneous_clicks:
                "He intentado varias opciones pero no consigo avanzar",
              back_navigation:
                "Necesito revisar contenido anterior porque no entiendo esta parte",
            };

            if (highSeverityPatterns.length > 1) {
              const mainIssue =
                messageMap[primaryPattern.type] ||
                "Estoy teniendo dificultades con esta lección";
              return `${mainIssue} y estoy un poco bloqueado`;
            }

            return (
              messageMap[primaryPattern.type] || "Necesito ayuda con esta lección"
            );
          };

          const visibleUserMessage = generatePersonalizedMessage(analysis.patterns);

          const behaviorAnalysis = analyzeUserBehavior();

          const currentActivities = currentLesson
            ? lessonsActivities[currentLesson.lesson_id] || []
            : [];
          const requiredActivities = currentActivities.filter((a) => a.is_required);
          const pendingRequired = requiredActivities.filter((a) => !a.is_completed);
          const completedActivities = currentActivities.filter((a) => a.is_completed);

          let currentActivityFocus = null;
          if (activeTab === "activities" && pendingRequired.length > 0) {
            currentActivityFocus = pendingRequired[0];
          } else if (pendingRequired.length > 0) {
            currentActivityFocus = null;
          }

          const totalLessonsInCourse = modules.flatMap((m) => m.lessons).length;
          const currentLessonIdx = modules
            .flatMap((m) => m.lessons)
            .findIndex((l) => l.lesson_id === currentLesson?.lesson_id);
          const progressPercentage =
            totalLessonsInCourse > 0
              ? Math.round(((currentLessonIdx + 1) / totalLessonsInCourse) * 100)
              : 0;

          const lessonContext = getLessonContext();

          const enrichedLessonContext = lessonContext
            ? {
                ...lessonContext,
                userRole: user?.job_title || undefined,
                activitiesContext: {
                  totalActivities: currentActivities.length,
                  requiredActivities: requiredActivities.length,
                  completedActivities: completedActivities.length,
                  pendingRequiredCount: pendingRequired.length,
                  pendingRequiredTitles: pendingRequired
                    .map((a) => a.activity_title)
                    .join(", "),
                  activityTypes: currentActivities.map((a) => ({
                    title: a.activity_title,
                    type: a.activity_type,
                    isRequired: a.is_required,
                    isCompleted: a.is_completed,
                  })),
                  currentActivityFocus: currentActivityFocus
                    ? {
                        title: currentActivityFocus.activity_title,
                        type: currentActivityFocus.activity_type,
                        isRequired: currentActivityFocus.is_required,
                        description:
                          currentActivityFocus.activity_description || "Sin descripción",
                      }
                    : null,
                },
                userBehaviorContext: behaviorAnalysis,
                learningProgressContext: {
                  currentLessonNumber: currentLessonIdx + 1,
                  totalLessons: totalLessonsInCourse,
                  progressPercentage: progressPercentage,
                  currentTab: activeTab,
                  timeInCurrentLesson: currentLesson?.duration_seconds
                    ? `${Math.round(currentLesson.duration_seconds / 60)} minutos`
                    : "Desconocido",
                },
                difficultyDetected: {
                  patterns: analysis.patterns.map((p) => ({
                    type: p.type,
                    severity: p.severity,
                    description: (() => {
                      switch (p.type) {
                        case "inactivity":
                          return `Ha estado ${p.metadata?.inactivityDuration ? Math.floor(p.metadata.inactivityDuration / 60000) : "varios"} minutos sin avanzar`;
                        case "excessive_scroll":
                          return "Ha estado haciendo scroll repetidamente buscando información";
                        case "failed_attempts":
                          return "Ha intentado completar la actividad varias veces sin éxito";
                        case "frequent_deletion":
                          return "Ha estado escribiendo y borrando varias veces";
                        case "repetitive_cycles":
                          return "Ha estado yendo y viniendo entre diferentes secciones";
                        case "erroneous_clicks":
                          return "Ha hecho varios clicks sin resultado";
                        default:
                          return "Está teniendo dificultades para avanzar";
                      }
                    })(),
                  })),
                  overallScore: analysis.overallScore,
                  shouldIntervene: analysis.shouldIntervene,
                  suggestedHelpType: (() => {
                    const primaryPattern = analysis.patterns[0];
                    if (!primaryPattern) return "general";

                    switch (primaryPattern.type) {
                      case "inactivity":
                        return activeTab === "activities"
                          ? "activity_guidance"
                          : "content_explanation";
                      case "excessive_scroll":
                        return "content_navigation";
                      case "failed_attempts":
                        return "activity_hints";
                      case "frequent_deletion":
                        return "activity_structure";
                      case "repetitive_cycles":
                        return "concept_clarification";
                      case "erroneous_clicks":
                        return "interface_guidance";
                      default:
                        return "general";
                    }
                  })(),
                },
              }
            : lessonContext;

          if (workshopMetadata && enrichedLessonContext?.contextType === "workshop") {
            await sendLiaMessage(
              visibleUserMessage,
              undefined,
              enrichedLessonContext as any,
              true
            );
          } else {
            await sendLiaMessage(
              visibleUserMessage,
              enrichedLessonContext as any,
              undefined,
              true
            );
          }
        }}
      >
        <CourseAccessGuard courseSlug={slug}>
          <DeleteNoteConfirmModal
            isOpen={isDeleteNoteConfirmOpen}
            isDeleting={isDeletingNote}
            onClose={closeDeleteNoteConfirm}
            onConfirm={confirmDeleteNote}
          />

          {/* Script para prevenir scroll en body cuando hay modales abiertos */}
          <div className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden">
            {/* Header superior con nueva estructura - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-3 md:px-4 py-1.5 md:py-2 shrink-0 relative z-40"
            >
              <div className="flex items-center justify-between w-full gap-2">
                {/* Sección izquierda: Botón regresar | Nombre del taller */}
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  {/* Botón de regreso */}
                  <button
                    onClick={() => router.back()}
                    className="p-1.5 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 rounded-lg transition-colors shrink-0"
                    aria-label={t("header.backButton")}
                    title={t("header.backButton")}
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                  </button>

                  {/* Nombre del taller */}
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-sm md:text-base font-bold text-[#0A2540] dark:text-white truncate"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                    >
                      {course.title || course.course_title}
                    </h1>
                    <p
                      className="hidden md:block text-xs text-[#6C757D] dark:text-white/60"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                    >
                      {t("header.workshop")}
                    </p>
                  </div>
                </div>

                {/* Sección central: Progreso - Solo porcentaje compacto en móviles */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Barra de progreso - Oculto en móviles */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-32 lg:w-40 h-1.5 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${courseProgress}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] rounded-full shadow-lg"
                      />
                    </div>
                  </div>
                  {/* Porcentaje compacto - Visible siempre */}
                  <span
                    className="text-xs text-[#0A2540] dark:text-white font-medium bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shrink-0"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                  >
                    {courseProgress}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Contenido principal - 3 paneles - Responsive */}
            <div
              ref={swipeRef}
              className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0F1419] relative z-10"
              style={{
                marginRight: isLiaOpen && !isMobile ? "420px" : 0,
                transition: "margin-right 0.3s ease-in-out",
              }}
            >
              <CourseSidebarPanel
                isOpen={isLeftPanelOpen}
                isMobile={isMobile}
                modules={modules}
                currentLesson={currentLesson}
                isMaterialCollapsed={isMaterialCollapsed}
                isNotesCollapsed={isNotesCollapsed}
                expandedLessons={expandedLessons}
                expandedModules={expandedModules}
                lessonsActivities={lessonsActivities}
                lessonsMaterials={lessonsMaterials}
                lessonsQuizStatus={lessonsQuizStatus}
                savedNotes={savedNotes}
                notesStats={notesStats}
                onClose={closeLeftPanel}
                onToggleMaterialCollapsed={toggleMaterialCollapsed}
                onToggleNotesCollapsed={toggleNotesCollapsed}
                onToggleLessonExpand={toggleLessonExpand}
                onToggleModuleExpand={toggleModuleExpand}
                onSelectLesson={handleLessonChange}
                onCreateNote={openNewNoteModal}
                onEditNote={openEditNoteModal}
                onDeleteNote={handleDeleteNote}
                onOpenSidebar={openLeftPanel}
                onOpenContentSection={openContentSection}
                onOpenNotesSection={() => openNotesSection({ collapseMaterials: true })}
                onOpenNewNote={() => {
                  openNotesSection({ collapseMaterials: true });
                  openNewNoteModal();
                }}
              />

              {/* Panel Central - Contenido del video */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1E2329] backdrop-blur-sm rounded-lg shadow-xl my-0 md:my-2 mx-0 md:mx-2 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30">
                {modules.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center mx-auto mb-4 border border-[#0A2540]/30">
                        <BookOpen className="w-10 h-10 text-[#00D4B3]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Este curso aún no tiene contenido
                      </h3>
                      <p
                        className="text-[#6C757D] dark:text-white/60"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                      >
                        Los módulos y lecciones se agregarán pronto
                      </p>
                    </div>
                  </div>
                ) : currentLesson ? (
                  <>
                    {/* Tabs mejorados - Responsive */}
                    <div
                      id="tour-tabs-container"
                      className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex gap-1 md:gap-2 p-2 md:p-3 rounded-t-xl h-[56px] items-center overflow-x-auto scrollbar-hide scroll-smooth"
                      style={{
                        scrollPaddingLeft: "0.5rem",
                        scrollPaddingRight: "0.5rem",
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      <div className="flex gap-1 md:gap-2 items-center min-w-max">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          const shouldHideText = !isActive && isMobile;

                          return (
                            <button
                              key={tab.id}
                              id={`tour-tab-${tab.id}`}
                              onClick={() => handleTabChange(tab.id)}
                              className={`flex items-center rounded-xl transition-all duration-200 relative group shrink-0 ${shouldHideText
                                ? "px-2 py-2 hover:px-3 hover:gap-2"
                                : "px-3 md:px-4 py-2 gap-1 md:gap-2 min-w-fit"
                                } ${isActive
                                  ? "bg-[#0A2540] text-white shadow-lg shadow-[#0A2540]/25"
                                  : "text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
                                }`}
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontWeight: isActive ? 600 : 500,
                                scrollSnapAlign: "start",
                              }}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span
                                className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${shouldHideText
                                  ? "max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100"
                                  : ""
                                  }`}
                              >
                                {tab.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contenido del tab activo */}
                    <div
                      className="flex-1 min-h-0 overflow-y-auto md:pb-0"
                      style={{
                        paddingBottom: isMobile
                          ? mobileContentPaddingBottom
                          : undefined,
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="h-auto p-3 md:p-6 flex flex-col gap-4"
                        >
                          {activeTab === "video" && (
                            <VideoContent
                              lesson={currentLesson}
                              onNavigatePrevious={navigateToPreviousLesson}
                              onNavigateNext={navigateToNextLesson}
                              getPreviousLesson={getPreviousLesson}
                              getNextLesson={getNextLesson}
                              markLessonAsCompleted={markLessonAsCompleted}
                              canCompleteLesson={canCompleteLesson}
                              onCourseCompleted={() =>
                                setIsCourseCompletedModalOpen(true)
                              }
                              onCannotComplete={() =>
                                setIsCannotCompleteModalOpen(true)
                              }
                              hasActivities={
                                (lessonsActivities[currentLesson.lesson_id]?.length || 0) > 0
                              }
                              activities={
                                lessonsActivities[currentLesson.lesson_id] || []
                              }
                              setActiveTab={setActiveTab}
                            />
                          )}
                          {activeTab === "transcript" && (
                            <TranscriptContent
                              lesson={currentLesson}
                              slug={slug}
                              onNoteCreated={addNoteToLocalState}
                              onStatsUpdate={updateNotesStatsOptimized}
                            />
                          )}
                          {activeTab === "summary" && currentLesson && (
                            <SummaryContent lesson={currentLesson} slug={slug} />
                          )}
                          {activeTab === "activities" && (
                            <ActivitiesContent
                              lesson={currentLesson}
                              slug={slug}
                              onPromptsChange={handlePromptsChange}
                              userRole={user?.job_title}
                              onNavigateNext={navigateToNextLesson}
                              hasNextLesson={!!getNextLesson()}
                              selectedLang={selectedLang}
                              onLessonContentRefresh={loadLessonActivitiesAndMaterials}
                            />
                          )}
                          {activeTab === "questions" && (
                            <QuestionsSection slug={slug} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
                      <p
                        className="text-[#6C757D] dark:text-white/60"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                      >
                        {t("loading.lesson")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel Derecho - Solo LIA - REMOVED */}
            </div>

            {/* Barra de navegación inferior flotante para móviles */}
            {isMobileBottomNavVisible && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#1E2329]/95 backdrop-blur-lg border-t border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
                  height: "calc(70px + max(env(safe-area-inset-bottom), 8px))",
                }}
              >
                <div className="flex items-center justify-around px-4 py-3">
                  {/* Botón Material del Curso */}
                  <button
                    onClick={() => {
                      openLeftPanel();
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isLeftPanelOpen
                      ? "bg-[#0A2540]/10 dark:bg-[#0A2540]/20 text-[#0A2540] dark:text-[#00D4B3]"
                      : "text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
                      }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="text-xs font-medium">Material</span>
                  </button>

                  {/* Botón Lección Anterior */}
                  {getPreviousLesson() && (
                    <button
                      onClick={navigateToPreviousLesson}
                      className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="text-xs font-medium">Anterior</span>
                    </button>
                  )}

                  {/* Botón Lección Siguiente */}
                  {getNextLesson() && (
                    <button
                      onClick={navigateToNextLesson}
                      className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[#6C757D] dark:text-white/60 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                      <span className="text-xs font-medium">Siguiente</span>
                    </button>
                  )}

                  {/* Botón LIA - Integrado en la barra inferior móvil */}
                  <LiaMobileButton />
                </div>
              </motion.div>
            )}

            <NotesModal
              isOpen={isNotesModalOpen}
              onClose={closeNotesModal}
              onSave={handleSaveNote}
              initialNote={editingNote}
              isEditing={!!editingNote}
            />

            {/* Modal de Curso Completado */}
            <AnimatePresence>
              {isCourseCompletedModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={() => setIsCourseCompletedModalOpen(false)}
                >
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />

                  {/* Modal Content */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
                  >
                    {/* Icono de éxito */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                      ¡Felicidades!
                    </h3>

                    {/* Mensaje */}
                    <p className="text-gray-600 dark:text-slate-300 text-center mb-4">
                      Has completado el curso exitosamente. ¡Buen trabajo!
                    </p>

                    {/* Mensaje informativo sobre certificado */}
                    <div className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/40 rounded-xl p-3 mb-6">
                      <p
                        className="text-[#0A2540] dark:text-white text-center text-sm"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                      >
                        🎓 A continuación, completa una breve encuesta para acceder
                        a tu certificado
                      </p>
                    </div>

                    {/* Botón de cerrar */}
                    <button
                      onClick={async () => {
                        setIsCourseCompletedModalOpen(false);
                        // Verificar si el usuario ya calificó después de cerrar el modal de completado
                        if (!hasUserRated && slug) {
                          try {
                            const ratingCheck =
                              await CourseRatingService.checkUserRating(slug);
                            if (!ratingCheck.hasRating) {
                              setTimeout(() => {
                                setIsRatingModalOpen(true);
                              }, 500);
                            } else {
                              setHasUserRated(true);
                            }
                          } catch (error) {
                            console.error("Error checking rating:", error);
                          }
                        }
                      }}
                      className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                    >
                      Aceptar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal de No Puede Completar */}
            <AnimatePresence>
              {isCannotCompleteModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={() => setIsCannotCompleteModalOpen(false)}
                >
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />

                  {/* Modal Content */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
                  >
                    {/* Icono de advertencia */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#F59E0B]/25">
                        <HelpCircle className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Título */}
                    <h3
                      className="text-2xl font-bold text-[#0A2540] dark:text-white text-center mb-2"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                    >
                      No puedes completar esta lección
                    </h3>

                    {/* Mensaje */}
                    <p
                      className="text-[#6C757D] dark:text-white/80 text-center mb-6"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                    >
                      Tienes lecciones pendientes que debes completar antes de
                      terminar el curso. Completa todas las lecciones anteriores en
                      orden.
                    </p>

                    {/* Botón de cerrar */}
                    <button
                      onClick={() => setIsCannotCompleteModalOpen(false)}
                      className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                    >
                      Entendido
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal de Validación (Actividades/Video/Quiz) */}
            <AnimatePresence>
              {validationModal.isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={() =>
                    setValidationModal({ ...validationModal, isOpen: false })
                  }
                >
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />

                  {/* Modal Content */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-[#1E2329]/95 backdrop-blur-md rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-2xl max-w-md w-full p-6"
                  >
                    {/* Icono según el tipo de validación */}
                    <div className="flex justify-center mb-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${validationModal.type === "activity" ||
                          validationModal.type === "quiz"
                          ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25"
                          : validationModal.type === "video"
                            ? "bg-gradient-to-br from-[#0A2540] to-[#00D4B3] shadow-[#0A2540]/25"
                            : "bg-gradient-to-br from-[#F59E0B] to-[#F59E0B] shadow-[#F59E0B]/25"
                          }`}
                      >
                        {validationModal.type === "activity" ||
                        validationModal.type === "quiz" ? (
                          <AlertCircle className="w-10 h-10 text-white" />
                        ) : validationModal.type === "video" ? (
                          <Info className="w-10 h-10 text-white" />
                        ) : (
                          <XCircle className="w-10 h-10 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Título */}
                    <h3
                      className="text-2xl font-bold text-[#0A2540] dark:text-white text-center mb-2"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                    >
                      {validationModal.title}
                    </h3>

                    {/* Mensaje */}
                    <p
                      className="text-[#6C757D] dark:text-white/80 text-center mb-4"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                    >
                      {validationModal.message}
                    </p>

                    {/* Detalles adicionales si existen */}
                    {validationModal.details && (
                      <div className="mb-6 p-3 bg-[#E9ECEF]/30 dark:bg-[#0F1419] rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <p
                          className="text-[#0A2540] dark:text-white text-sm text-center font-medium"
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {validationModal.details}
                        </p>
                      </div>
                    )}

                    {/* Botón de cerrar */}
                    <button
                      onClick={() => {
                        const lessonIdToShow = validationModal.lessonId;
                        setValidationModal({ ...validationModal, isOpen: false });

                        if (lessonIdToShow) {
                          openLessonById(lessonIdToShow, {
                            tab: "activities",
                            trackOpen: false,
                          });
                        }
                      }}
                      className="w-full px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#0A2540]/25"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                    >
                      Entendido
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal de Rating */}
            <CourseRatingModal
              isOpen={isRatingModalOpen}
              onClose={() => setIsRatingModalOpen(false)}
              courseSlug={slug}
              courseTitle={course?.title || course?.course_title}
              onRatingSubmitted={() => {
                setHasUserRated(true);
                setIsRatingModalOpen(false);
                router.push("/certificates");
              }}
            />

            {/* LIA In-Context Chat for Courses */}
            <CourseLia
              lessonId={currentLesson?.lesson_id}
              lessonTitle={currentLesson?.lesson_title}
              courseSlug={slug}
              transcriptContent={liaTranscript}
              summaryContent={liaSummary}
              lessonContent={currentLesson?.lesson_description}
              customColors={{
                panelBg: colors.bgSecondary,
                borderColor: "rgba(255,255,255,0.1)",
                accentColor: colors.accent,
                textPrimary: "#FFFFFF",
                textSecondary: "rgba(255,255,255,0.6)",
              }}
              onSaveNote={handleSaveLiaNote}
            />

            {/* Tour de voz contextual para la página de aprendizaje */}

            {/* Joyride Tour */}
            {isJoyrideMounted && <Joyride {...joyrideComponentProps} />}
          </div>
        </CourseAccessGuard>
      </WorkshopLearningProvider>
    </VideoPlayerProvider>
  );
}
