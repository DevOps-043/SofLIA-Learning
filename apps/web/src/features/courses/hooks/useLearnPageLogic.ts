'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Joyride from 'react-joyride'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '../../../hooks/useSwipe'
import type { DifficultyAnalysis } from '../../../lib/rrweb/difficulty-pattern-detector'
import type { CourseLessonContext } from '../../../core/types/lia.types'
import { useVideoPlayerOptional } from '../../../app/courses/[slug]/learn/VideoPlayerContext'
import { useCourseLearnTour } from '../../tours/hooks/useCourseLearnTour'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  canCompleteOrderedLesson,
  findOrderedLessonIndex,
  getOrderedLessons,
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
import type React from 'react'

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
  const [loading, setLoading] = useState(true)
  const [courseProgress, setCourseProgress] = useState(6)
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false)
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>(
    [],
  )
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false)
  const [isJoyrideMounted, setIsJoyrideMounted] = useState(false)

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
    setIsJoyrideMounted(true)
  }, [])

  const {
    activeTab,
    setActiveTab,
    handleTabChange,
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

  const { joyrideProps } = useCourseLearnTour({
    enabled: true,
    onOpenLia: openLia,
    onSwitchTab: (tab) => setActiveTab(tab),
    onOpenNotes: (shouldScroll = true) => {
      openNotesSection({ collapseMaterials: false })
      if (shouldScroll) {
        setTimeout(() => {
          const element = document.getElementById('tour-notes-section')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    },
  })
  const joyrideComponentProps =
    joyrideProps as React.ComponentProps<typeof Joyride>

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

    const videoFullyWatched =
      currentLesson.is_completed ||
      (currentLesson.progress_percentage ?? 0) >= 95
    const hasPending =
      activitiesList.length > 0 &&
      activitiesList.some((activity) => !activity.is_completed)

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
    validationModal,
    setValidationModal,
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
  } = useLessonCompletion({
    slug,
    currentLesson,
    modules,
    setModules,
    setCurrentLesson,
    setCourseProgress,
    canCompleteLesson,
  })

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
    trackUserAction,
    videoPlayerContext,
  })

  const handleSaveLiaNote = useCallback(
    (content: string) => {
      openLiaNoteModal(content)
    },
    [openLiaNoteModal],
  )

  const getLessonContext = useCallback(() => {
    return buildLearnLessonContext({
      course,
      currentLesson,
      modules,
      workshopMetadata,
      slug,
      userJobTitle: user?.job_title || undefined,
    })
  }, [course, currentLesson, modules, slug, user?.job_title, workshopMetadata])

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
        id: 'transcript' as const,
        label: t('tabs.transcript'),
        icon: 'ScrollText',
      },
      { id: 'summary' as const, label: t('tabs.summary'), icon: 'FileText' },
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
    isLiaOpen,
    openLia,
    closeLia,
    sendLiaMessage,
    handleSaveLiaNote,
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
    markLessonAsCompleted,
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isClearHistoryModalOpen,
    setIsClearHistoryModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
    validationModal,
    setValidationModal,
    currentActivityPrompts,
    isPromptsCollapsed,
    setIsPromptsCollapsed,
    handlePromptsChange,
    trackUserAction,
    analyzeUserBehavior,
    userBehaviorLog,
    joyrideComponentProps,
    isJoyrideMounted,
  }
}

export type LearnPageLogicResult = ReturnType<typeof useLearnPageLogic>
