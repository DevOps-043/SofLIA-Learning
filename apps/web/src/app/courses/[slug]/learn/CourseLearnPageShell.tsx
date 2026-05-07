'use client'

import type React from 'react'
import { Activity, BookOpen, Lock, MessageCircle, Play } from 'lucide-react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import Joyride from 'react-joyride'
import type { NotesModalProps } from '../../../../core/components/NotesModal'
import { COURSE_LEARN_TOUR_TARGET_IDS } from '../../../../core/constants/tourTargets'
import { CourseAccessGuard } from '../../../../features/courses/components/CourseAccessGuard'
import { CourseLia } from '../../../../features/courses/components/CourseLia'
import { CourseRatingModal } from '../../../../features/courses/components/CourseRatingModal'
import {
  ActivitiesContent,
  CannotCompleteModal,
  CourseCompletedModal,
  CourseSidebarPanel,
  DeleteNoteConfirmModal,
  LearnPageHeader,
  LearnPageMobileNav,
  LearnPageValidationModal,
  QuestionsSection,
  VideoContent,
} from '../../../../features/courses/components/learn'
import type { LearnPageLogicResult } from '../../../../features/courses/hooks/useLearnPageLogic'
import { useCourseIntroVideos } from '../../../../features/courses/hooks/useCourseIntroVideos'
import { useCourseLearnJoyride } from '../../../../features/tours/hooks/useCourseLearnJoyride'
import { OnboardingVideoPlayer } from '../../../../features/tours/components/OnboardingVideoPlayer'
import { useMobilePerformanceMode } from '../../../../lib/utils/mobile-performance'
import { useVideoPlayerOptional } from './VideoPlayerContext'

const NotesModal = dynamic(
  () =>
    import('../../../../core/components/NotesModal/NotesModalPdfMake').then((mod) => ({
      default: mod.NotesModalPdfMake,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        Cargando notas...
      </div>
    ),
    ssr: false,
  },
)

const TAB_ICONS = {
  Play,
  Activity,
  MessageCircle,
} as const

const NotesModalComponent = NotesModal as unknown as (
  props: NotesModalProps,
) => React.ReactElement | null

const CourseLiaComponent = CourseLia as unknown as (
  props: React.ComponentProps<typeof CourseLia>,
) => React.ReactElement | null

interface CourseLearnPageShellProps {
  logic: LearnPageLogicResult
}

export function CourseLearnPageShell({ logic }: CourseLearnPageShellProps) {
  const videoPlayerContext = useVideoPlayerOptional()
  const { disableHeavyEffects } = useMobilePerformanceMode()
  const {
    slug,
    router,
    user,
    colors,
    t,
    ready,
    translationFallbackWarning,
    mounted,
    course,
    modules,
    currentLesson,
    learningPathState,
    learningPathBlockState,
    loading,
    courseProgress,
    liaTranscript,
    liaSummary,
    isLiaTranscriptLoading,
    isLiaSummaryLoading,
    isLiaOpen,
    closeLia,
    handleSaveLiaNote,
    handleVideoCompleted,
    selectedLang,
    activeTab,
    setActiveTab,
    handleTabChange,
    tabs,
    isMobile,
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
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
    handleActivityShortcut,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
    getLessonContext,
    canCompleteLesson,
    completeCurrentCourse,
    markLessonAsCompleted,
    closeCannotCompleteModal,
    closeRatingModal,
    handleCourseCompletedClose,
    handleRatingSubmit,
    isCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    isRatingModalOpen,
    openCannotCompleteModal,
    openCourseCompletedModal,
    validationModal,
    setValidationModal,
    handlePromptsChange,
    focusedActivityId,
    setFocusedActivityId,
    focusedMaterialId,
    setFocusedMaterialId,
  } = logic

  const courseTitle = course?.title || course?.course_title || ''

  const {
    introVideos,
    showVideoIntro,
    isLoadingIntro,
    handleVideoIntroComplete,
    restartWithIntroVideos,
  } = useCourseIntroVideos({
    courseSlug: slug,
    organizationId: course?.organization_id ?? null,
    enabled: ready && Boolean(course),
  })

  const courseTour = useCourseLearnJoyride({
    courseSlug: slug,
    courseTitle,
    lessonTitle: currentLesson?.lesson_title,
    enabled: ready && Boolean(course) && !showVideoIntro && !isLoadingIntro,
    isMobile,
    closeLia,
    openLeftPanel,
    closeLeftPanel,
    setActiveTab,
    pauseVideoPlayback: videoPlayerContext?.pauseAllVideos,
    clearPendingAutoPlay: videoPlayerContext
      ? () => videoPlayerContext.setShouldAutoPlay(false)
      : undefined,
    mobilePerformanceMode: disableHeavyEffects,
    restartWithIntroVideos,
  })

  const handleValidationClose = () => {
    const lessonIdToShow = validationModal.lessonId
    const redirectTab =
      validationModal.redirectTab ||
      (validationModal.type === 'video' ? 'video' : 'activities')

    setValidationModal((previous) => ({ ...previous, isOpen: false }))

    if (lessonIdToShow) {
      openLessonById(lessonIdToShow, {
        tab: redirectTab,
        trackOpen: false,
      })
    }
  }

  const currentLessonContext = currentLesson ? getLessonContext() : undefined

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin mx-auto mb-4" />
          <p
            className="text-[#0A2540] dark:text-white text-lg"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            {mounted && ready ? t('loading.general') : 'Cargando...'}
          </p>
        </div>
      </div>
    )
  }

  if (!course) {
    if (learningPathBlockState?.learningPath) {
      const nextAvailableCourse = learningPathBlockState.learningPath.items.find(
        (item) => item.isUnlocked && !item.isCompleted && item.slug,
      )

      return (
        <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl rounded-3xl border border-amber-500/20 bg-white p-8 shadow-[0_24px_80px_rgba(10,37,64,0.08)] dark:bg-[#111827]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-amber-600">
              {t('learningPath.badge')}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#0A2540] dark:text-white">
              {t('learningPath.blockedTitle')}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#52606D] dark:text-white/75">
              {learningPathBlockState.message}
            </p>
            <div className="mt-6 rounded-2xl border border-[#00D4B3]/20 bg-[#00D4B3]/5 p-4">
              <h2 className="text-sm font-semibold text-[#0A2540] dark:text-white">
                {learningPathBlockState.learningPath.title}
              </h2>
              <p className="mt-1 text-xs text-[#52606D] dark:text-white/60">
                {t('leftPanel.learningPath.completedCount', {
                  completed: learningPathBlockState.learningPath.completedItemsCount,
                  total: learningPathBlockState.learningPath.totalItemsCount,
                })}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#00D4B3]"
                  style={{
                    width: `${learningPathBlockState.learningPath.progressPercentage}%`,
                  }}
                />
              </div>
              <div className="mt-4 space-y-2">
                {learningPathBlockState.learningPath.items.map((item) => (
                  <div
                    key={`${item.courseId}-${item.position}`}
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      item.isCurrent
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : item.isUnlocked
                          ? 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5'
                          : 'border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900 dark:text-white/90">
                        {item.position}. {item.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-white/50">
                        {item.isCompleted
                          ? t('leftPanel.learningPath.status.completed')
                          : item.isUnlocked
                            ? t('leftPanel.learningPath.status.available')
                            : t('leftPanel.learningPath.status.locked')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {nextAvailableCourse?.slug ? (
                <button
                  onClick={() =>
                    router.push(`/courses/${nextAvailableCourse.slug}/learn`)
                  }
                  className="rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d2f4d]"
                >
                  {t('learningPath.availableCta')}
                </button>
              ) : null}
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#0A2540] transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.04]"
              >
                {t('navigation.backToCourses')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-[#0A2540] dark:text-white mb-4"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
          >
            {t('errors.courseNotFound')}
          </h1>
          <p
            className="text-[#6C757D] dark:text-white/80 mb-8"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            {t('errors.courseNotFoundMessage')}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-lg transition-colors"
          >
            {t('navigation.backToCourses')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <CourseAccessGuard courseSlug={slug}>
          <DeleteNoteConfirmModal
            isOpen={isDeleteNoteConfirmOpen}
            isDeleting={isDeletingNote}
            onClose={closeDeleteNoteConfirm}
            onConfirm={confirmDeleteNote}
          />

          <div
            id={COURSE_LEARN_TOUR_TARGET_IDS.workspace}
            className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden"
          >
            <LearnPageHeader
              courseTitle={courseTitle}
              courseProgress={courseProgress}
              onBack={() => router.back()}
              onRestartTour={courseTour.restartTour}
              restartTourLabel={t('tour.replayLabel')}
              disableHeavyEffects={disableHeavyEffects}
            />

            {translationFallbackWarning ? (
              <div className="mx-2 md:mx-4 mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="text-sm font-semibold">
                  {translationFallbackWarning.title}
                </p>
                <p className="text-xs">{translationFallbackWarning.message}</p>
              </div>
            ) : null}

            <div
              ref={swipeRef}
              className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0F1419] relative z-10"
              style={{
                marginRight: isLiaOpen && !isMobile ? '420px' : 0,
                transition: disableHeavyEffects ? 'none' : 'margin-right 0.3s ease-in-out',
              }}
            >
              <CourseSidebarPanel
                isOpen={isLeftPanelOpen}
                isMobile={isMobile}
                modules={modules}
                currentLesson={currentLesson}
                learningPathState={learningPathState}
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
                onSelectActivity={handleActivityShortcut}
                onSelectMaterial={({ materialId, lesson }) =>
                  handleActivityShortcut({
                    activityId: materialId,
                    contentType: 'material',
                    lesson,
                  })
                }
                onSelectLesson={handleLessonChange}
                onCreateNote={openNewNoteModal}
                onEditNote={openEditNoteModal}
                onDeleteNote={handleDeleteNote}
                onOpenSidebar={openLeftPanel}
                onOpenContentSection={openContentSection}
                onOpenNotesSection={() =>
                  openNotesSection({ collapseMaterials: true })
                }
                onOpenNewNote={() => {
                  openNotesSection({ collapseMaterials: true })
                  openNewNoteModal()
                }}
              />

              <div className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1E2329] rounded-lg my-0 md:my-2 mx-0 md:mx-2 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 ${disableHeavyEffects ? '' : 'backdrop-blur-sm shadow-xl'}`}>
                {modules.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 flex items-center justify-center mx-auto mb-4 border border-[#0A2540]/30">
                        <BookOpen className="w-10 h-10 text-[#00D4B3]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Este curso aun no tiene contenido
                      </h3>
                      <p
                        className="text-[#6C757D] dark:text-white/60"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                        }}
                      >
                        Los modulos y lecciones se agregaran pronto
                      </p>
                    </div>
                  </div>
                ) : currentLesson ? (
                  <>
                    <div
                      id={COURSE_LEARN_TOUR_TARGET_IDS.tools}
                      className="bg-white dark:bg-[#1E2329] border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex gap-1 md:gap-2 p-2 md:p-3 rounded-t-xl h-[56px] items-center overflow-x-auto scrollbar-hide scroll-smooth"
                      style={{
                        scrollPaddingLeft: '0.5rem',
                        scrollPaddingRight: '0.5rem',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      <div className="flex gap-1 md:gap-2 items-center min-w-max">
                        {tabs.map((tab) => {
                          const Icon = TAB_ICONS[tab.icon as keyof typeof TAB_ICONS]
                          const isActive = activeTab === tab.id
                          const shouldHideText = !isActive && isMobile

                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleTabChange(tab.id)}
                              className={`flex items-center rounded-xl transition-all duration-200 relative group shrink-0 ${
                                shouldHideText
                                  ? 'px-2 py-2 hover:px-3 hover:gap-2'
                                  : 'px-3 md:px-4 py-2 gap-1 md:gap-2 min-w-fit'
                              } ${
                                isActive
                                  ? 'bg-[#0A2540] dark:bg-[#00D4B3] text-white dark:text-[#0A2540] shadow-lg shadow-[#0A2540]/25 dark:shadow-[#00D4B3]/25'
                                  : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-[#E9ECEF]/50 dark:hover:bg-[#00D4B3]/10'
                              }`}
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: isActive ? 600 : 500,
                                scrollSnapAlign: 'start',
                              }}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span
                                className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out ${
                                  shouldHideText
                                    ? 'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100'
                                    : ''
                                }`}
                              >
                                {tab.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

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
                          initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
                          animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
                          exit={disableHeavyEffects ? undefined : { opacity: 0, y: -20 }}
                          transition={disableHeavyEffects ? undefined : { duration: 0.3 }}
                          className="h-auto p-3 md:p-6 flex flex-col gap-4"
                        >
                          {activeTab === 'video' && (
                            <VideoContent
                              lesson={currentLesson}
                              onNavigatePrevious={navigateToPreviousLesson}
                              onNavigateNext={navigateToNextLesson}
                              onVideoCompleted={handleVideoCompleted}
                              getPreviousLesson={getPreviousLesson}
                              getNextLesson={getNextLesson}
                              markLessonAsCompleted={markLessonAsCompleted}
                              canCompleteLesson={canCompleteLesson}
                              onCourseCompleted={openCourseCompletedModal}
                              onCannotComplete={openCannotCompleteModal}
                              hasActivities={
                                (lessonsActivities[currentLesson.lesson_id]
                                  ?.length || 0) > 0
                              }
                              activities={
                                lessonsActivities[currentLesson.lesson_id] || []
                              }
                              slug={slug}
                              transcriptContent={liaTranscript}
                              summaryContent={liaSummary}
                              isTranscriptLoading={isLiaTranscriptLoading}
                              isSummaryLoading={isLiaSummaryLoading}
                              onNoteCreated={addNoteToLocalState}
                              onStatsUpdate={updateNotesStatsOptimized}
                              setActiveTab={setActiveTab}
                              suppressVideoPlayback={
                                courseTour.suppressVideoPlayback
                              }
                              skipVideoAutoplay={
                                disableHeavyEffects || courseTour.skipVideoAutoplay
                              }
                            />
                          )}
                          {activeTab === 'activities' && (
                            <ActivitiesContent
                              lesson={currentLesson}
                              slug={slug}
                              onPromptsChange={handlePromptsChange}
                              userRole={user?.job_title}
                              onNavigateNext={navigateToNextLesson}
                              hasNextLesson={!!getNextLesson()}
                              onCompleteCourse={completeCurrentCourse}
                              selectedLang={selectedLang}
                              onLessonContentRefresh={
                                loadLessonActivitiesAndMaterials
                              }
                              focusedActivityId={focusedActivityId}
                              focusedMaterialId={focusedMaterialId}
                              onActivityFocused={() => {
                                setFocusedActivityId(null)
                                setFocusedMaterialId(null)
                              }}
                            />
                          )}
                          {activeTab === 'questions' && (
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
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                        }}
                      >
                        {t('loading.lesson')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <LearnPageMobileNav
              isVisible={isMobileBottomNavVisible}
              isLeftPanelOpen={isLeftPanelOpen}
              hasPreviousLesson={!!getPreviousLesson()}
              hasNextLesson={!!getNextLesson()}
              onOpenMaterial={openLeftPanel}
              onNavigatePrevious={navigateToPreviousLesson}
              onNavigateNext={navigateToNextLesson}
              disableHeavyEffects={disableHeavyEffects}
            />

            {noteError && (
              <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-lg">
                <span>{noteError}</span>
                <button type="button" onClick={() => setNoteError(null)} className="ml-3 text-red-300 hover:text-red-100">✕</button>
              </div>
            )}

            <NotesModalComponent
              isOpen={isNotesModalOpen}
              onClose={closeNotesModal}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
              initialNote={editingNote}
              isEditing={!!editingNote}
            />

            <CourseCompletedModal
              isOpen={isCourseCompletedModalOpen}
              onClose={() => {
                void handleCourseCompletedClose()
              }}
            />

            <CannotCompleteModal
              isOpen={isCannotCompleteModalOpen}
              onClose={closeCannotCompleteModal}
            />

            <LearnPageValidationModal
              isOpen={validationModal.isOpen}
              type={validationModal.type}
              title={validationModal.title}
              message={validationModal.message}
              details={validationModal.details}
              onClose={handleValidationClose}
            />

            <CourseRatingModal
              isOpen={isRatingModalOpen}
              onClose={closeRatingModal}
              courseTitle={course.title || course.course_title || ''}
              onSubmit={handleRatingSubmit}
            />

            <CourseLiaComponent
              lessonId={currentLesson?.lesson_id}
              lessonTitle={currentLesson?.lesson_title}
              courseSlug={slug}
              transcriptContent={liaTranscript}
              summaryContent={liaSummary}
              lessonContent={currentLesson?.lesson_description}
              lessonContext={currentLessonContext}
              customColors={{
                accentColor: colors.accent,
              }}
              onSaveNote={handleSaveLiaNote}
            />

            {mounted && courseTour.run ? <Joyride {...courseTour.joyrideProps} /> : null}
          </div>

        </CourseAccessGuard>

      {/* Video introductorio — fuera de guards/providers para renderizado garantizado */}
      {showVideoIntro && introVideos.length > 0 && (
        <OnboardingVideoPlayer
          videos={introVideos}
          onComplete={handleVideoIntroComplete}
        />
      )}
    </>
  )
}
