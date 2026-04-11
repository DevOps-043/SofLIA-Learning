'use client'

import type React from 'react'
import { Activity, BookOpen, MessageCircle, Play } from 'lucide-react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import Joyride from 'react-joyride'
import { WorkshopLearningProvider } from '../../../../components/WorkshopLearningProvider'
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
import { CourseRatingService } from '../../../../features/courses/services/course-rating.service'
import { useCourseLearnJoyride } from '../../../../features/tours/hooks/useCourseLearnJoyride'

const NotesModal = dynamic(
  () =>
    import('../../../../core/components/NotesModal').then((mod) => ({
      default: mod.NotesModalWithLibraries,
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
  const {
    slug,
    router,
    user,
    colors,
    t,
    ready,
    mounted,
    course,
    modules,
    currentLesson,
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
    handleWorkshopHelpAccepted,
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
    getLessonContext,
    canCompleteLesson,
    markLessonAsCompleted,
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
    handlePromptsChange,
  } = logic

  const courseTitle = course?.title || course?.course_title || ''
  const courseTour = useCourseLearnJoyride({
    courseSlug: slug,
    courseTitle,
    lessonTitle: currentLesson?.lesson_title,
    enabled: ready && Boolean(course),
    isMobile,
    closeLia,
    openLeftPanel,
    closeLeftPanel,
    setActiveTab,
  })

  const handleCourseCompletedClose = async () => {
    setIsCourseCompletedModalOpen(false)
    if (!hasUserRated && slug) {
      try {
        const ratingCheck = await CourseRatingService.checkUserRating(slug)
        if (!ratingCheck.hasRating) {
          setTimeout(() => setIsRatingModalOpen(true), 500)
        } else {
          setHasUserRated(true)
        }
      } catch (error) {
        console.error('Error checking rating:', error)
      }
    }
  }

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
    <WorkshopLearningProvider
      workshopId={course.id || course.course_id || slug}
      activityId={currentLesson?.lesson_id || 'no-lesson'}
      enabled={!!course && !!currentLesson}
      suppressDisplay={activeTab === 'video'}
      checkInterval={15000}
      assistantPosition="bottom-right"
      assistantCompact={false}
      onHelpAccepted={handleWorkshopHelpAccepted}
    >
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
            />

            <div
              ref={swipeRef}
              className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0F1419] relative z-10"
              style={{
                marginRight: isLiaOpen && !isMobile ? '420px' : 0,
                transition: 'margin-right 0.3s ease-in-out',
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
                onOpenNotesSection={() =>
                  openNotesSection({ collapseMaterials: true })
                }
                onOpenNewNote={() => {
                  openNotesSection({ collapseMaterials: true })
                  openNewNoteModal()
                }}
              />

              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1E2329] backdrop-blur-sm rounded-lg shadow-xl my-0 md:my-2 mx-0 md:mx-2 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30">
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
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
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
                              onCourseCompleted={() =>
                                setIsCourseCompletedModalOpen(true)
                              }
                              onCannotComplete={() =>
                                setIsCannotCompleteModalOpen(true)
                              }
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
                              selectedLang={selectedLang}
                              onLessonContentRefresh={
                                loadLessonActivitiesAndMaterials
                              }
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
            />

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
              onClose={handleCourseCompletedClose}
            />

            <CannotCompleteModal
              isOpen={isCannotCompleteModalOpen}
              onClose={() => setIsCannotCompleteModalOpen(false)}
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
              onClose={() => setIsRatingModalOpen(false)}
              courseSlug={slug}
              courseTitle={course.title || course.course_title || ''}
              onRatingSubmitted={() => {
                setHasUserRated(true)
                setIsRatingModalOpen(false)
                router.push('/certificates')
              }}
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
                panelBg: colors.bgSecondary,
                borderColor: 'rgba(255,255,255,0.1)',
                accentColor: colors.accent,
                textPrimary: '#FFFFFF',
                textSecondary: 'rgba(255,255,255,0.6)',
              }}
              onSaveNote={handleSaveLiaNote}
            />

            {mounted ? <Joyride {...courseTour.joyrideProps} /> : null}
          </div>
        </CourseAccessGuard>
      </WorkshopLearningProvider>
  )
}
