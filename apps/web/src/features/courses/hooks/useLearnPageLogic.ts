'use client'

import { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { useCurrentOrganizationId } from '../../../core/stores/organizationStore'
import { useVideoPlayerOptional } from '../../../app/courses/[slug]/learn/VideoPlayerContext'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLiaCourse } from '../context/LiaCourseContext'
import { CourseCertificateService } from '../services/course-certificate.service'

import { useCourseTheme } from './useCourseTheme'
import { useCourseCompletionFlow } from './useCourseCompletionFlow'
import { useLessonCompletion } from './useLessonCompletion'
import { useLessonNavigation } from './useLessonNavigation'
import { useLessonSidebarState } from './useLessonSidebarState'
import { useNotesManagement } from './useNotesManagement'
import { useUserBehaviorLog } from './useUserBehaviorLog'
import { useLearnPageCourseData } from './learn-page/useLearnPageCourseData'
import { useLearnPageLayout } from './learn-page/useLearnPageLayout'
import { useLearnPageLocalState } from './learn-page/useLearnPageLocalState'
import { useLearnPageLayoutDerived } from './learn-page/useLearnPageLayoutDerived'
import { useLearnPageLiaIntegration } from './learn-page/useLearnPageLiaIntegration'
import { useLearnPageEffects } from './learn-page/useLearnPageEffects'
import { useLearnPageActions } from './learn-page/useLearnPageActions'
import { useLearnPageTabs } from './learn-page/useLearnPageTabs'
import { useLearnTranslationWarning } from './learn-page/useLearnTranslationWarning'

type Locale = 'es' | 'en' | 'pt'

/**
 * Orchestrates the entire course-learn page by composing one focused
 * sub-hook per concern (local state, layout derivations, LIA bridge,
 * tabs, effects, imperative actions).  The orchestrator stays small
 * because every piece of logic has been pushed down into a sub-hook;
 * its job is to wire them together and expose the union of their
 * returned values to the page component.
 *
 * Hook-call order matters: callbacks like navigateToNextLesson are
 * needed by useLearnPageEffects, so useLessonNavigation runs before
 * useLearnPageEffects.  Same for markLessonAsCompleted →
 * useLearnPageActions.  Do not reorder without re-reading TDZ rules.
 */
export function useLearnPageLogic() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const {
    isOpen: isLiaOpen,
    openLia,
    closeLia,
    liaChat,
    isInteractionBlocked: isLiaInteractionBlocked,
    setInteractionBlocked: setLiaInteractionBlocked,
  } = useLiaCourse()
  const { user } = useAuth()
  const organizationId = useCurrentOrganizationId()
  const colors = useCourseTheme()
  const { t, i18n, ready } = useTranslation('learn')
  const selectedLang: Locale =
    i18n.language === 'en' ? 'en' : i18n.language === 'pt' ? 'pt' : 'es'

  const state = useLearnPageLocalState()
  const videoPlayerContext = useVideoPlayerOptional()

  const {
    activeTab,
    setActiveTab,
    handleTabChange: handleBaseTabChange,
    isMobile,
    screenHeight,
    visualViewportHeight,
    getInputAreaPadding,
  } = useLearnPageLayout({ currentLesson: state.currentLesson, videoPlayerContext })

  const sidebar = useLessonSidebarState({
    slug,
    selectedLang,
    modules: state.modules,
    currentLesson: state.currentLesson,
    isMobile,
  })

  const layoutDerived = useLearnPageLayoutDerived({
    isMobile,
    isLeftPanelOpen: sidebar.isLeftPanelOpen,
    visualViewportHeight,
    openLeftPanel: sidebar.openLeftPanel,
  })

  const notes = useNotesManagement({
    slug,
    modules: state.modules,
    currentLesson: state.currentLesson,
    isNotesCollapsed: sidebar.isNotesCollapsed,
    closeLia,
    organizationId,
  })

  useLearnPageCourseData({
    slug,
    selectedLang,
    organizationId,
    userJobTitle: user?.job_title || undefined,
    currentLesson: state.currentLesson,
    modules: state.modules,
    notesStatsLessonsWithNotes: notes.notesStats.lessonsWithNotes,
    applyServerNotesStats: notes.applyServerNotesStats,
    initializeNotesStats: notes.initializeNotesStats,
    setCourse: state.setCourse,
    setModules: state.setModules,
    setCurrentLesson: state.setCurrentLesson,
    setWorkshopMetadata: state.setWorkshopMetadata,
    setLiaTranscript: state.setLiaTranscript,
    setLiaSummary: state.setLiaSummary,
    setIsLiaTranscriptLoading: state.setIsLiaTranscriptLoading,
    setIsLiaSummaryLoading: state.setIsLiaSummaryLoading,
    setLoading: state.setLoading,
    setCourseProgress: state.setCourseProgress,
    setLearningPathState: state.setLearningPathState,
    setLearningPathBlockState: state.setLearningPathBlockState,
    setLearnDataTranslationContext: state.setLearnDataTranslationContext,
  })

  const { userBehaviorLog, trackUserAction, analyzeUserBehavior } = useUserBehaviorLog(
    state.currentLesson,
  )

  const { tabs, orderedLessons, currentLessonIndex, canCompleteLesson } = useLearnPageTabs({
    t,
    modules: state.modules,
    currentLesson: state.currentLesson,
  })

  const { markLessonAsCompleted, openValidationModal, validationModal, setValidationModal } =
    useLessonCompletion({
      slug,
      currentLesson: state.currentLesson,
      modules: state.modules,
      setModules: state.setModules,
      setCurrentLesson: state.setCurrentLesson,
      setCourseProgress: state.setCourseProgress,
      canCompleteLesson,
    })

  const courseId = state.course?.id ?? state.course?.course_id ?? null
  const courseEnrollmentId = state.course?.enrollment_id ?? null
  const courseOrganizationId =
    state.course?.organization_id ?? organizationId ?? null

  const handleCertificateReady = useCallback(
    (route: string) => CourseCertificateService.navigateToCertificateRoute(route, router),
    [router],
  )

  const completion = useCourseCompletionFlow({
    courseId,
    enrollmentId: courseEnrollmentId,
    organizationId: courseOrganizationId,
    courseSlug: slug,
    onCertificateReady: handleCertificateReady,
  })

  const actions = useLearnPageActions({
    setModules: state.setModules,
    setCurrentLesson: state.setCurrentLesson,
    setPendingVideoTransitionLessonId: state.setPendingVideoTransitionLessonId,
    loadLessonActivitiesAndMaterials: sidebar.loadLessonActivitiesAndMaterials,
    setFocusedActivityId: state.setFocusedActivityId,
    setFocusedMaterialId: state.setFocusedMaterialId,
    setCurrentActivityPrompts: state.setCurrentActivityPrompts,
    currentLesson: state.currentLesson,
    canCompleteLesson,
    markLessonAsCompleted,
    openCannotCompleteModal: completion.openCannotCompleteModal,
    openCourseCompletedModal: completion.openCourseCompletedModal,
    handleBaseTabChange,
    openValidationModal,
    trackUserAction,
  })

  const navigation = useLessonNavigation({
    orderedLessons,
    modules: state.modules,
    currentLesson: state.currentLesson,
    lessonsActivities: sidebar.lessonsActivities,
    lessonsMaterials: sidebar.lessonsMaterials,
    setCurrentLesson: state.setCurrentLesson,
    setActiveTab,
    markLessonAsCompleted,
    loadLessonActivitiesAndMaterials: sidebar.loadLessonActivitiesAndMaterials,
    openValidationModal,
    onActivityFocus: actions.handleSidebarContentFocus,
    trackUserAction,
    videoPlayerContext,
  })

  // Effects must run after navigation is wired (TDZ on navigateToNextLesson).
  useLearnPageEffects({
    activeTab,
    setActiveTab,
    closeLia,
    setLiaInteractionBlocked,
    currentActivityPrompts: state.currentActivityPrompts,
    prevPromptsLengthRef: state.prevPromptsLengthRef,
    setIsPromptsCollapsed: state.setIsPromptsCollapsed,
    setCurrentActivityPrompts: state.setCurrentActivityPrompts,
    currentLesson: state.currentLesson,
    lessonsActivities: sidebar.lessonsActivities,
    checkedAutoRedirectRef: state.checkedAutoRedirectRef,
    pendingVideoTransitionLessonId: state.pendingVideoTransitionLessonId,
    setPendingVideoTransitionLessonId: state.setPendingVideoTransitionLessonId,
    navigateToNextLesson: navigation.navigateToNextLesson,
  })

  const lia = useLearnPageLiaIntegration({
    liaChat,
    isLiaOpen,
    isLiaInteractionBlocked,
    openLia,
    closeLia,
    openLiaNoteModal: notes.openLiaNoteModal,
    course: state.course,
    currentLesson: state.currentLesson,
    modules: state.modules,
    workshopMetadata: state.workshopMetadata,
    slug,
    userJobTitle: user?.job_title || undefined,
    liaTranscript: state.liaTranscript,
    liaSummary: state.liaSummary,
    activeTab,
    lessonsActivities: sidebar.lessonsActivities,
    lessonsMaterials: sidebar.lessonsMaterials,
    lessonsQuizStatus: sidebar.lessonsQuizStatus,
    currentActivityPrompts: state.currentActivityPrompts,
  })

  const translationFallbackWarning = useLearnTranslationWarning({
    currentLesson: state.currentLesson,
    lessonTranslationContexts: sidebar.lessonTranslationContexts,
    learnDataTranslationContext: state.learnDataTranslationContext,
    selectedLang,
  })

  return {
    slug,
    router,
    user,
    colors,
    t,
    i18n,
    ready,
    selectedLang,
    translationFallbackWarning,
    mounted: state.mounted,
    course: state.course,
    modules: state.modules,
    currentLesson: state.currentLesson,
    setCurrentLesson: state.setCurrentLesson,
    workshopMetadata: state.workshopMetadata,
    learningPathState: state.learningPathState,
    learningPathBlockState: state.learningPathBlockState,
    loading: state.loading,
    courseProgress: state.courseProgress,
    liaTranscript: state.liaTranscript,
    liaSummary: state.liaSummary,
    isLiaTranscriptLoading: state.isLiaTranscriptLoading,
    isLiaSummaryLoading: state.isLiaSummaryLoading,
    isLiaOpen,
    openLia,
    closeLia,
    sendLiaMessage: lia.sendLiaMessage,
    handleSaveLiaNote: lia.handleSaveLiaNote,
    handleVideoCompleted: actions.handleVideoCompleted,
    getLessonContext: lia.getLessonContext,
    activeTab,
    setActiveTab,
    handleTabChange: actions.handleTabChange,
    tabs,
    isMobile,
    screenHeight,
    visualViewportHeight,
    isMobileBottomNavVisible: layoutDerived.isMobileBottomNavVisible,
    mobileContentPaddingBottom: layoutDerived.mobileContentPaddingBottom,
    calculateLiaMaxHeight: layoutDerived.calculateLiaMaxHeight,
    getInputAreaPadding,
    swipeRef: layoutDerived.swipeRef,
    closeLeftPanel: sidebar.closeLeftPanel,
    expandedLessons: sidebar.expandedLessons,
    expandedModules: sidebar.expandedModules,
    isLeftPanelOpen: sidebar.isLeftPanelOpen,
    isMaterialCollapsed: sidebar.isMaterialCollapsed,
    isNotesCollapsed: sidebar.isNotesCollapsed,
    lessonsActivities: sidebar.lessonsActivities,
    lessonsMaterials: sidebar.lessonsMaterials,
    lessonsQuizStatus: sidebar.lessonsQuizStatus,
    lessonContentSnapshots: sidebar.lessonContentSnapshots,
    lessonTranslationContexts: sidebar.lessonTranslationContexts,
    loadLessonActivitiesAndMaterials: sidebar.loadLessonActivitiesAndMaterials,
    openContentSection: sidebar.openContentSection,
    openLeftPanel: sidebar.openLeftPanel,
    openNotesSection: sidebar.openNotesSection,
    toggleLessonExpand: sidebar.toggleLessonExpand,
    toggleMaterialCollapsed: sidebar.toggleMaterialCollapsed,
    toggleModuleExpand: sidebar.toggleModuleExpand,
    toggleNotesCollapsed: sidebar.toggleNotesCollapsed,
    addNoteToLocalState: notes.addNoteToLocalState,
    closeDeleteNoteConfirm: notes.closeDeleteNoteConfirm,
    closeGeneratedSummaryViewer: notes.closeGeneratedSummaryViewer,
    closeNotesModal: notes.closeNotesModal,
    confirmDeleteNote: notes.confirmDeleteNote,
    duplicateGeneratedSummary: notes.duplicateGeneratedSummary,
    editingNote: notes.editingNote,
    generatedSummaryVersions: notes.generatedSummaryVersions,
    generateDefaultSummary: notes.generateDefaultSummary,
    handleDeleteNote: notes.handleDeleteNote,
    handleSaveNote: notes.handleSaveNote,
    isDeleteNoteConfirmOpen: notes.isDeleteNoteConfirmOpen,
    isDeletingNote: notes.isDeletingNote,
    isNotesModalOpen: notes.isNotesModalOpen,
    noteError: notes.noteError,
    setNoteError: notes.setNoteError,
    notesStats: notes.notesStats,
    navigateGeneratedSummary: notes.navigateGeneratedSummary,
    openEditNoteModal: notes.openEditNoteModal,
    openNewNoteModal: notes.openNewNoteModal,
    savedNotes: notes.savedNotes,
    regenerateSummary: notes.regenerateSummary,
    regeneratingSummaryModuleId: notes.regeneratingSummaryModuleId,
    updateNotesStatsOptimized: notes.updateNotesStatsOptimized,
    viewingGeneratedSummary: notes.viewingGeneratedSummary,
    viewingSummaryIndex: notes.viewingSummaryIndex,
    viewingSummaryVersions: notes.viewingSummaryVersions,
    getPreviousLesson: navigation.getPreviousLesson,
    getNextLesson: navigation.getNextLesson,
    handleActivityShortcut: navigation.handleActivityShortcut,
    handleLessonChange: navigation.handleLessonChange,
    navigateToPreviousLesson: navigation.navigateToPreviousLesson,
    navigateToNextLesson: navigation.navigateToNextLesson,
    openLessonById: navigation.openLessonById,
    orderedLessons,
    currentLessonIndex,
    canCompleteLesson,
    completeCurrentCourse: actions.completeCurrentCourse,
    markLessonAsCompleted,
    closeCannotCompleteModal: completion.closeCannotCompleteModal,
    closeRatingModal: completion.closeRatingModal,
    handleCourseCompletedClose: completion.handleCourseCompletedClose,
    handleRatingSubmit: completion.handleRatingSubmit,
    hasUserRated: completion.hasUserRated,
    isCourseCompletedModalOpen: completion.isCourseCompletedModalOpen,
    isCannotCompleteModalOpen: completion.isCannotCompleteModalOpen,
    isClearHistoryModalOpen: state.isClearHistoryModalOpen,
    setIsClearHistoryModalOpen: state.setIsClearHistoryModalOpen,
    isRatingModalOpen: completion.isRatingModalOpen,
    openCannotCompleteModal: completion.openCannotCompleteModal,
    openCourseCompletedModal: completion.openCourseCompletedModal,
    validationModal,
    setValidationModal,
    currentActivityPrompts: state.currentActivityPrompts,
    isPromptsCollapsed: state.isPromptsCollapsed,
    setIsPromptsCollapsed: state.setIsPromptsCollapsed,
    handlePromptsChange: actions.handlePromptsChange,
    focusedActivityId: state.focusedActivityId,
    setFocusedActivityId: state.setFocusedActivityId,
    focusedMaterialId: state.focusedMaterialId,
    setFocusedMaterialId: state.setFocusedMaterialId,
    trackUserAction,
    analyzeUserBehavior,
    userBehaviorLog,
  }
}

export type LearnPageLogicResult = ReturnType<typeof useLearnPageLogic>
