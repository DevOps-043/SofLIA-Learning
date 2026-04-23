import { AnimatePresence, motion } from 'framer-motion';
import {
  ActivitiesContent,
  QuestionsSection,
  VideoContent,
} from '@/features/courses/components/learn';
import type { CourseLearnShellChildProps } from './CourseLearnPageShell.types';

export function ActiveLessonTabContent({
  courseTour,
  disableHeavyEffects,
  logic,
}: CourseLearnShellChildProps) {
  const lesson = logic.currentLesson;
  if (!lesson) return null;

  const lessonActivities = logic.lessonsActivities[lesson.lesson_id] || [];

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto md:pb-0"
      style={{ paddingBottom: logic.isMobile ? logic.mobileContentPaddingBottom : undefined }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
          className="h-auto p-3 md:p-6 flex flex-col gap-4"
          exit={disableHeavyEffects ? undefined : { opacity: 0, y: -20 }}
          initial={disableHeavyEffects ? false : { opacity: 0, y: 20 }}
          key={logic.activeTab}
          transition={disableHeavyEffects ? undefined : { duration: 0.3 }}
        >
          {logic.activeTab === 'video' && (
            <VideoContent
              activities={lessonActivities}
              canCompleteLesson={logic.canCompleteLesson}
              getNextLesson={logic.getNextLesson}
              getPreviousLesson={logic.getPreviousLesson}
              hasActivities={lessonActivities.length > 0}
              isSummaryLoading={logic.isLiaSummaryLoading}
              isTranscriptLoading={logic.isLiaTranscriptLoading}
              lesson={lesson}
              markLessonAsCompleted={logic.markLessonAsCompleted}
              onCannotComplete={logic.openCannotCompleteModal}
              onCourseCompleted={logic.openCourseCompletedModal}
              onNavigateNext={logic.navigateToNextLesson}
              onNavigatePrevious={logic.navigateToPreviousLesson}
              onNoteCreated={logic.addNoteToLocalState}
              onStatsUpdate={logic.updateNotesStatsOptimized}
              onVideoCompleted={logic.handleVideoCompleted}
              setActiveTab={logic.setActiveTab}
              skipVideoAutoplay={disableHeavyEffects || courseTour.skipVideoAutoplay}
              slug={logic.slug}
              summaryContent={logic.liaSummary}
              suppressVideoPlayback={courseTour.suppressVideoPlayback}
              transcriptContent={logic.liaTranscript}
            />
          )}
          {logic.activeTab === 'activities' && (
            <ActivitiesContent
              hasNextLesson={!!logic.getNextLesson()}
              lesson={lesson}
              onCompleteCourse={logic.completeCurrentCourse}
              onLessonContentRefresh={logic.loadLessonActivitiesAndMaterials}
              onNavigateNext={logic.navigateToNextLesson}
              onPromptsChange={logic.handlePromptsChange}
              selectedLang={logic.selectedLang}
              slug={logic.slug}
              userRole={logic.user?.job_title}
            />
          )}
          {logic.activeTab === 'questions' && <QuestionsSection slug={logic.slug} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
