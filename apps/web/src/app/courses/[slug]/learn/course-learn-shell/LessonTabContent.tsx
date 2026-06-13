'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ActivitiesContent, QuestionsSection, VideoContent } from '@/features/courses/components/learn'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function LessonTabContent({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  const lesson = logic.currentLesson
  if (!lesson) return null
  return (
    <div className="min-h-0 flex-1 overflow-y-auto md:pb-0" style={{ paddingBottom: logic.isMobile ? logic.mobileContentPaddingBottom : undefined }}>
      <AnimatePresence initial={false}>
        <motion.div key={logic.activeTab} initial={shell.disableHeavyEffects ? false : { opacity: 0, y: 20 }} animate={shell.disableHeavyEffects ? undefined : { opacity: 1, y: 0 }} exit={shell.disableHeavyEffects ? undefined : { opacity: 0 }} transition={shell.disableHeavyEffects ? undefined : { duration: shell.interfaceTransitionMs / 1000 }} className="flex h-auto flex-col gap-4 p-3 md:p-6">
          {logic.activeTab === 'video' ? <VideoContent lesson={lesson} enrollmentId={logic.course?.enrollment_id ?? null} organizationId={logic.course?.organization_id ?? null} onNavigatePrevious={logic.navigateToPreviousLesson} onNavigateNext={logic.navigateToNextLesson} onVideoCompleted={logic.handleVideoCompleted} getPreviousLesson={logic.getPreviousLesson} getNextLesson={logic.getNextLesson} markLessonAsCompleted={logic.markLessonAsCompleted} canCompleteLesson={logic.canCompleteLesson} onCourseCompleted={logic.openCourseCompletedModal} onCannotComplete={logic.openCannotCompleteModal} hasActivities={(logic.lessonsActivities[lesson.lesson_id]?.length || 0) > 0} activities={logic.lessonsActivities[lesson.lesson_id] || []} slug={logic.slug} transcriptContent={logic.liaTranscript} summaryContent={logic.liaSummary} isTranscriptLoading={logic.isLiaTranscriptLoading} isSummaryLoading={logic.isLiaSummaryLoading} onNoteCreated={logic.addNoteToLocalState} onStatsUpdate={logic.updateNotesStatsOptimized} setActiveTab={logic.setActiveTab} suppressVideoPlayback={false} skipVideoAutoplay={shell.disableHeavyEffects} /> : null}
          {logic.activeTab === 'activities' ? <ActivitiesContent lesson={lesson} slug={logic.slug} initialContent={logic.lessonContentSnapshots[lesson.lesson_id] ?? null} onPromptsChange={logic.handlePromptsChange} userRole={logic.user?.job_title} onNavigateNext={logic.navigateToNextLesson} hasNextLesson={!!logic.getNextLesson()} onCompleteCourse={logic.completeCurrentCourse} selectedLang={logic.selectedLang} onLessonContentRefresh={logic.loadLessonActivitiesAndMaterials} onQuizSubmitted={logic.refreshNotesAfterQuiz} focusedActivityId={logic.focusedActivityId} focusedMaterialId={logic.focusedMaterialId} onActivityFocused={() => { logic.setFocusedActivityId(null); logic.setFocusedMaterialId(null) }} /> : null}
          {logic.activeTab === 'questions' ? <QuestionsSection slug={logic.slug} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
