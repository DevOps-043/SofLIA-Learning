'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '../../../hooks/useSwipe'
import type { DifficultyAnalysis } from '../../../lib/rrweb/difficulty-pattern-detector'
import type { CourseLessonContext } from '../../../core/types/lia.types'
import { useCurrentOrganizationId } from '../../../core/stores/organizationStore'
import { useVideoPlayerOptional } from '../../../app/courses/[slug]/learn/VideoPlayerContext'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  canCompleteOrderedLesson,
  findOrderedLessonIndex,
  getOrderedLessons,
  hasIncompleteActivities,
  isLessonVideoCompleted,
} from './lessonNavigation.utils'
import { useCourseTheme } from './useCourseTheme'
import {
  buildLearnLessonContext,
} from './learn-page/learn-page.service'
import { useLearnPageCourseData } from './learn-page/useLearnPageCourseData'
import { useLearnPageLayout } from './learn-page/useLearnPageLayout'
import {
  buildWorkshopEnrichedLessonContext,
  buildWorkshopHelpMessage,
} from '../services/learn-workshop-assistant.service'
import { CourseCertificateService } from '../services/course-certificate.service'
import { useCourseCompletionFlow } from './useCourseCompletionFlow'
import { useLessonCompletion } from './useLessonCompletion'
import { useLessonNavigation } from './useLessonNavigation'
import { useLessonSidebarState } from './useLessonSidebarState'
import { useNotesManagement } from './useNotesManagement'
import { useUserBehaviorLog } from './useUserBehaviorLog'
import { useLiaCourse } from '../context/LiaCourseContext'
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
  LearnTab,
} from '../components/learn/types'

type Lesson = LearnLesson
type Module = LearnModule
type CourseData = LearnCourseData

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104
const CONTENT_BOTTOM_PADDING_MOBILE = 32

export function useLearnPageLogic() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const { isOpen: isLiaOpen, openLia, closeLia, liaChat } = useLiaCourse()
  const { user } = useAuth()
  const organizationId = useCurrentOrganizationId()
  const colors = useCourseTheme()
  const { t, i18n, ready } = useTranslation('learn')
  const selectedLang =
    i18n.language === 'en' ? 'en' : i18n.language === 'pt' ? 'pt' : 'es'

  const [mounted, setMounted] = useState(false)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [workshopMetadata, setWorkshopMetadata] =
    useState<CourseLessonContext | null>(null)
  const [liaTranscript, setLiaTranscript] = useState<string | null>(null)
  const [liaSummary, setLiaSummary] = useState<string | null>(null)
  const [isLiaTranscriptLoading, setIsLiaTranscriptLoading] = useState(false)
  const [isLiaSummaryLoading, setIsLiaSummaryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courseProgress, setCourseProgress] = useState(6)
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false)
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>(
    [],
  )
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false)
  const [pendingVideoTransitionLessonId, setPendingVideoTransitionLessonId] =
    useState<string | null>(null)

  const prevPromptsLengthRef = useRef<number>(0)
  const checkedAutoRedirectRef = useRef<string | null>(null)
  const videoPlayerContext = useVideoPlayerOptional()

  const sendLiaMessage = useCallback(
    async (
      message: string,
      courseContext?: CourseLessonContext,
      workshopContext?: CourseLessonContext,
      isSystemMessage: boolean = false,
    ) => {
      if (!liaChat?.sendMessage) {
        console.warn('LIA Chat no inicializado')
        return
      }

      if (!isLiaOpen) {
        openLia()
      }

      await liaChat.sendMessage(
        message,
        courseContext,
        workshopContext,
        isSystemMessage,
      )
    },
    [isLiaOpen, liaChat, openLia],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    activeTab,
    setActiveTab,
    handleTabChange: handleBaseTabChange,
    isMobile,
    screenHeight,
    visualViewportHeight,
    getInputAreaPadding,
  } = useLearnPageLayout({
    currentLesson,
    videoPlayerContext,
  })

  const {
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
  } = useLessonSidebarState({
    slug,
    modules,
    currentLesson,
    isMobile,
  })

  const swipeRef = useSwipe({
    onSwipeRight: () => {
      if (isMobile && !isLeftPanelOpen) {
        openLeftPanel()
      }
    },
    onSwipeLeft: () => {},
    threshold: 50,
    velocity: 0.3,
    enabled: isMobile && !isLeftPanelOpen,
  })

  const isMobileBottomNavVisible = isMobile && !isLeftPanelOpen
  const mobileContentPaddingBottom = isMobileBottomNavVisible
    ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
    : `calc(env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`

  const calculateLiaMaxHeight = useMemo(() => {
    if (isMobile) {
      if (visualViewportHeight !== null) {
        const headerHeight = 56
        const bottomNavHeight = isMobileBottomNavVisible
          ? MOBILE_BOTTOM_NAV_HEIGHT_PX
          : 0

        return `calc(${visualViewportHeight - headerHeight - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`
      }

      return undefined
    }

    return 'calc(100vh - 3rem)'
  }, [isMobile, isMobileBottomNavVisible, visualViewportHeight])

  const {
    addNoteToLocalState,
    applyServerNotesStats,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    editingNote,
    handleDeleteNote,
    handleSaveNote,
    initializeNotesStats,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    noteError,
    setNoteError,
    notesStats,
    openEditNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,
  } = useNotesManagement({
    slug,
    modules,
    currentLesson,
    isNotesCollapsed,
    closeLia,
  })

  useLearnPageCourseData({
    slug,
    selectedLang,
    organizationId,
    userJobTitle: user?.job_title || undefined,
    currentLesson,
    modules,
    notesStatsLessonsWithNotes: notesStats.lessonsWithNotes,
    applyServerNotesStats,
    initializeNotesStats,
    setCourse,
    setModules,
    setCurrentLesson,
    setWorkshopMetadata,
    setLiaTranscript,
    setLiaSummary,
    setIsLiaTranscriptLoading,
    setIsLiaSummaryLoading,
    setLoading,
    setCourseProgress,
  })

  const { userBehaviorLog, trackUserAction, analyzeUserBehavior } =
    useUserBehaviorLog(currentLesson)

  useEffect(() => {
    if (activeTab !== 'activities') {
      setCurrentActivityPrompts([])
      setIsPromptsCollapsed(false)
      prevPromptsLengthRef.current = 0
    }
  }, [activeTab])

  useEffect(() => {
    const previousLength = prevPromptsLengthRef.current
    const currentLength = currentActivityPrompts.length

    if (previousLength === 0 && currentLength > 0) {
      setIsPromptsCollapsed(false)
    }

    prevPromptsLengthRef.current = currentLength
  }, [currentActivityPrompts.length])

  const handlePromptsChange = useCallback((prompts: string[]) => {
    setCurrentActivityPrompts(prompts)
  }, [])

  const handleVideoCompleted = useCallback(
    (lessonId: string) => {
      setModules((prevModules) =>
        prevModules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.lesson_id === lessonId
              ? {
                  ...lesson,
                  progress_percentage: 100,
                }
              : lesson,
          ),
        })),
      )
      setCurrentLesson((prevLesson) =>
        prevLesson?.lesson_id === lessonId
          ? {
              ...prevLesson,
              progress_percentage: 100,
            }
          : prevLesson,
      )
      setPendingVideoTransitionLessonId(lessonId)
      void loadLessonActivitiesAndMaterials(lessonId)
    },
    [loadLessonActivitiesAndMaterials],
  )

  useEffect(() => {
    if (!currentLesson?.lesson_id) {
      return
    }

    const lessonId = currentLesson.lesson_id
    if (checkedAutoRedirectRef.current === lessonId) {
      return
    }

    const activitiesList = lessonsActivities[lessonId]
    if (activitiesList === undefined) {
      return
    }

    checkedAutoRedirectRef.current = lessonId

    if (activeTab !== 'video') {
      return
    }

    const videoFullyWatched = isLessonVideoCompleted(currentLesson)
    const hasPending =
      activitiesList.length > 0 && hasIncompleteActivities(activitiesList)

    if (videoFullyWatched && hasPending) {
      setActiveTab('activities')
    }
  }, [
    activeTab,
    currentLesson?.is_completed,
    currentLesson?.lesson_id,
    currentLesson?.progress_percentage,
    lessonsActivities,
    setActiveTab,
  ])

  const orderedLessons = useMemo(() => getOrderedLessons(modules), [modules])

  const currentLessonIndex = useMemo(
    () => findOrderedLessonIndex(orderedLessons, currentLesson?.lesson_id),
    [orderedLessons, currentLesson?.lesson_id],
  )

  const canCompleteLesson = useCallback(
    (lessonId: string) => canCompleteOrderedLesson(orderedLessons, lessonId),
    [orderedLessons],
  )

  const {
    markLessonAsCompleted,
    openValidationModal,
    validationModal,
    setValidationModal,
  } = useLessonCompletion({
    slug,
    currentLesson,
    modules,
    setModules,
    setCurrentLesson,
    setCourseProgress,
    canCompleteLesson,
  })

  const courseId = course?.id ?? course?.course_id ?? null
  const courseEnrollmentId = course?.enrollment_id ?? null
  const courseOrganizationId = course?.organization_id ?? organizationId ?? null

  const handleCertificateReady = useCallback(
    (route: string) => {
      CourseCertificateService.navigateToCertificateRoute(route, router)
    },
    [router],
  )

  const {
    closeCannotCompleteModal,
    closeRatingModal,
    handleCourseCompletedClose,
    handleRatingSubmit,
    hasUserRated,
    isCannotCompleteModalOpen,
    isCourseCompletedModalOpen,
    isRatingModalOpen,
    openCannotCompleteModal,
    openCourseCompletedModal,
  } = useCourseCompletionFlow({
    courseId,
    enrollmentId: courseEnrollmentId,
    organizationId: courseOrganizationId,
    courseSlug: slug,
    onCertificateReady: handleCertificateReady,
  })

  const handleTabChange = useCallback(
    async (newTab: LearnTab) => {
      if (
        newTab === 'activities' &&
        currentLesson &&
        !isLessonVideoCompleted(currentLesson)
      ) {
        trackUserAction('attempted_activities_access_before_video_completed', {
          lessonId: currentLesson.lesson_id,
          lessonTitle: currentLesson.lesson_title,
        })
        openValidationModal({
          title: 'Finaliza el video para continuar',
          message:
            'Por favor, finaliza el video antes de continuar con las actividades.',
          type: 'video',
          lessonId: currentLesson.lesson_id,
          redirectTab: 'video',
        })
        return
      }

      await handleBaseTabChange(newTab)
    },
    [currentLesson, handleBaseTabChange, openValidationModal, trackUserAction],
  )

  const {
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
  } = useLessonNavigation({
    orderedLessons,
    modules,
    currentLesson,
    lessonsActivities,
    lessonsMaterials,
    setCurrentLesson,
    setActiveTab,
    markLessonAsCompleted,
    loadLessonActivitiesAndMaterials,
    openValidationModal,
    trackUserAction,
    videoPlayerContext,
  })

  const completeCurrentCourse = useCallback(async () => {
    if (!currentLesson?.lesson_id) {
      return
    }

    if (!canCompleteLesson(currentLesson.lesson_id)) {
      openCannotCompleteModal()
      return
    }

    const success = await markLessonAsCompleted(currentLesson.lesson_id)

    if (success) {
      openCourseCompletedModal()
    }
  }, [
    canCompleteLesson,
    currentLesson?.lesson_id,
    markLessonAsCompleted,
    openCannotCompleteModal,
    openCourseCompletedModal,
  ])

  // Effect para transición automática tras completar video.
  // Ubicado después de useLessonNavigation para evitar TDZ de navigateToNextLesson.
  useEffect(() => {
    if (!pendingVideoTransitionLessonId || !currentLesson?.lesson_id) {
      return
    }

    if (pendingVideoTransitionLessonId !== currentLesson.lesson_id) {
      setPendingVideoTransitionLessonId(null)
      return
    }

    if (activeTab !== 'video') {
      setPendingVideoTransitionLessonId(null)
      return
    }

    const activitiesList = lessonsActivities[pendingVideoTransitionLessonId]

    if (activitiesList === undefined) {
      return
    }

    const hasPendingActivities = hasIncompleteActivities(activitiesList)

    setPendingVideoTransitionLessonId(null)

    if (hasPendingActivities) {
      setActiveTab('activities')
      return
    }

    void navigateToNextLesson()
  }, [
    activeTab,
    currentLesson?.lesson_id,
    lessonsActivities,
    navigateToNextLesson,
    pendingVideoTransitionLessonId,
    setActiveTab,
  ])

  const handleSaveLiaNote = useCallback(
    (content: string) => {
      openLiaNoteModal(content)
    },
    [openLiaNoteModal],
  )

  const getLessonContext = useCallback(() => {
    const currentActivities = currentLesson
      ? lessonsActivities[currentLesson.lesson_id]
      : undefined
    const currentMaterials = currentLesson
      ? lessonsMaterials[currentLesson.lesson_id]
      : undefined
    const currentQuizStatus = currentLesson
      ? lessonsQuizStatus[currentLesson.lesson_id]
      : undefined

    return buildLearnLessonContext({
      course,
      currentLesson,
      modules,
      workshopMetadata,
      slug,
      userJobTitle: user?.job_title || undefined,
      transcriptContent: liaTranscript,
      summaryContent: liaSummary,
      activeTab,
      currentPage:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      currentActivities,
      currentMaterials,
      quizStatus: currentQuizStatus,
      currentActivityPrompts,
    })
  }, [
    activeTab,
    course,
    currentActivityPrompts,
    currentLesson,
    liaSummary,
    liaTranscript,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    modules,
    slug,
    user?.job_title,
    workshopMetadata,
  ])

  const handleWorkshopHelpAccepted = useCallback(
    async (analysis: DifficultyAnalysis) => {
      openLia()

      const visibleUserMessage = buildWorkshopHelpMessage(analysis)
      const behaviorAnalysis = analyzeUserBehavior()
      const currentActivities = currentLesson
        ? lessonsActivities[currentLesson.lesson_id] || []
        : []
      const lessonContext = getLessonContext()
      const enrichedLessonContext = buildWorkshopEnrichedLessonContext({
        lessonContext,
        analysis,
        behaviorAnalysis,
        currentActivities,
        activeTab,
        currentLesson,
        modules,
        userJobTitle: user?.job_title || undefined,
      })

      if (
        workshopMetadata &&
        enrichedLessonContext?.contextType === 'workshop'
      ) {
        await sendLiaMessage(
          visibleUserMessage,
          undefined,
          enrichedLessonContext,
          true,
        )
        return
      }

      await sendLiaMessage(
        visibleUserMessage,
        enrichedLessonContext,
        undefined,
        true,
      )
    },
    [
      activeTab,
      analyzeUserBehavior,
      currentLesson,
      getLessonContext,
      lessonsActivities,
      modules,
      openLia,
      sendLiaMessage,
      user?.job_title,
      workshopMetadata,
    ],
  )

  const tabs = useMemo(
    () => [
      { id: 'video' as const, label: t('tabs.video'), icon: 'Play' },
      {
        id: 'activities' as const,
        label: t('tabs.activities'),
        icon: 'Activity',
      },
      {
        id: 'questions' as const,
        label: t('tabs.questions'),
        icon: 'MessageCircle',
      },
    ],
    [t],
  )

  return {
    slug,
    router,
    user,
    colors,
    t,
    i18n,
    ready,
    selectedLang,
    mounted,
    course,
    modules,
    currentLesson,
    setCurrentLesson,
    workshopMetadata,
    loading,
    courseProgress,
    liaTranscript,
    liaSummary,
    isLiaTranscriptLoading,
    isLiaSummaryLoading,
    isLiaOpen,
    openLia,
    closeLia,
    sendLiaMessage,
    handleSaveLiaNote,
    handleVideoCompleted,
    getLessonContext,
    handleWorkshopHelpAccepted,
    activeTab,
    setActiveTab,
    handleTabChange,
    tabs,
    isMobile,
    screenHeight,
    visualViewportHeight,
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
    calculateLiaMaxHeight,
    getInputAreaPadding,
    swipeRef,
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
    noteError,
    setNoteError,
    notesStats,
    openEditNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
    orderedLessons,
    currentLessonIndex,
    canCompleteLesson,
    completeCurrentCourse,
    markLessonAsCompleted,
    closeCannotCompleteModal,
    closeRatingModal,
    handleCourseCompletedClose,
    handleRatingSubmit,
    hasUserRated,
    isCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    isClearHistoryModalOpen,
    setIsClearHistoryModalOpen,
    isRatingModalOpen,
    openCannotCompleteModal,
    openCourseCompletedModal,
    validationModal,
    setValidationModal,
    currentActivityPrompts,
    isPromptsCollapsed,
    setIsPromptsCollapsed,
    handlePromptsChange,
    trackUserAction,
    analyzeUserBehavior,
    userBehaviorLog,
  }
}

export type LearnPageLogicResult = ReturnType<typeof useLearnPageLogic>
