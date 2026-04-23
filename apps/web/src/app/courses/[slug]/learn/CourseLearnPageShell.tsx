'use client';

import { WorkshopLearningProvider } from '@/components/WorkshopLearningProvider';
import { CourseAccessGuard } from '@/features/courses/components/CourseAccessGuard';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';
import { useCourseLearnJoyride } from '@/features/tours/hooks/useCourseLearnJoyride';
import { useMobilePerformanceMode } from '@/lib/utils/mobile-performance';
import { CourseLearnLoadingState } from './page-shell/CourseLearnLoadingState';
import { CourseLearnWorkspace } from './page-shell/CourseLearnWorkspace';
import { CourseNotFoundState } from './page-shell/CourseNotFoundState';
import { LearningPathBlockedState } from './page-shell/LearningPathBlockedState';
import { useVideoPlayerOptional } from './VideoPlayerContext';

interface CourseLearnPageShellProps {
  logic: LearnPageLogicResult;
}

export function CourseLearnPageShell({ logic }: CourseLearnPageShellProps) {
  const videoPlayerContext = useVideoPlayerOptional();
  const { disableHeavyEffects } = useMobilePerformanceMode();
  const courseTitle = logic.course?.title || logic.course?.course_title || '';
  const courseTour = useCourseLearnJoyride({
    clearPendingAutoPlay: videoPlayerContext
      ? () => videoPlayerContext.setShouldAutoPlay(false)
      : undefined,
    closeLeftPanel: logic.closeLeftPanel,
    closeLia: logic.closeLia,
    courseSlug: logic.slug,
    courseTitle,
    enabled: logic.ready && Boolean(logic.course),
    isMobile: logic.isMobile,
    lessonTitle: logic.currentLesson?.lesson_title,
    mobilePerformanceMode: disableHeavyEffects,
    openLeftPanel: logic.openLeftPanel,
    pauseVideoPlayback: videoPlayerContext?.pauseAllVideos,
    setActiveTab: logic.setActiveTab,
  });

  const handleValidationClose = () => {
    const lessonIdToShow = logic.validationModal.lessonId;
    const redirectTab =
      logic.validationModal.redirectTab ||
      (logic.validationModal.type === 'video' ? 'video' : 'activities');

    logic.setValidationModal((previous) => ({ ...previous, isOpen: false }));

    if (lessonIdToShow) {
      logic.openLessonById(lessonIdToShow, {
        tab: redirectTab,
        trackOpen: false,
      });
    }
  };

  if (!logic.ready || logic.loading) {
    return (
      <CourseLearnLoadingState
        isMounted={logic.mounted}
        isReady={logic.ready}
        t={logic.t}
      />
    );
  }

  if (!logic.course) {
    return logic.learningPathBlockState?.learningPath ? (
      <LearningPathBlockedState logic={logic} />
    ) : (
      <CourseNotFoundState logic={logic} />
    );
  }

  const currentLessonContext = logic.currentLesson
    ? logic.getLessonContext()
    : undefined;

  return (
    <WorkshopLearningProvider
      activityId={logic.currentLesson?.lesson_id || 'no-lesson'}
      assistantCompact={false}
      assistantPosition="bottom-right"
      checkInterval={15000}
      enabled={!!logic.currentLesson && !logic.isMobile}
      onHelpAccepted={logic.handleWorkshopHelpAccepted}
      suppressDisplay={logic.activeTab === 'video'}
      workshopId={logic.course.id || logic.course.course_id || logic.slug}
    >
      <CourseAccessGuard courseSlug={logic.slug}>
        <CourseLearnWorkspace
          courseTitle={courseTitle}
          courseTour={courseTour}
          currentLessonContext={currentLessonContext}
          disableHeavyEffects={disableHeavyEffects}
          handleValidationClose={handleValidationClose}
          logic={logic}
        />
      </CourseAccessGuard>
    </WorkshopLearningProvider>
  );
}
