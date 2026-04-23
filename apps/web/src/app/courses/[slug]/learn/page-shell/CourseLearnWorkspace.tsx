import Joyride from 'react-joyride';
import { COURSE_LEARN_TOUR_TARGET_IDS } from '@/core/constants/tourTargets';
import { LearnPageHeader } from '@/features/courses/components/learn';
import type { CourseLessonContext } from '@/core/types/lia.types';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';
import type { CourseLearnTourState } from './CourseLearnPageShell.types';
import { CourseContentPanel } from './CourseContentPanel';
import { CourseLearnModals } from './CourseLearnModals';
import { CourseLearnSidebar } from './CourseLearnSidebar';
import { CourseLiaDock } from './CourseLiaDock';
import { CourseMobileNavigation } from './CourseMobileNavigation';
import { LearnNoteErrorToast } from './LearnNoteErrorToast';
import { TranslationFallbackBanner } from './TranslationFallbackBanner';

interface CourseLearnWorkspaceProps {
  courseTitle: string;
  courseTour: CourseLearnTourState;
  currentLessonContext: CourseLessonContext | undefined;
  disableHeavyEffects: boolean;
  handleValidationClose: () => void;
  logic: LearnPageLogicResult;
}

export function CourseLearnWorkspace({
  courseTitle,
  courseTour,
  currentLessonContext,
  disableHeavyEffects,
  handleValidationClose,
  logic,
}: CourseLearnWorkspaceProps) {
  return (
    <div
      className="fixed inset-0 h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 overflow-hidden"
      id={COURSE_LEARN_TOUR_TARGET_IDS.workspace}
    >
      <LearnPageHeader
        courseProgress={logic.courseProgress}
        courseTitle={courseTitle}
        disableHeavyEffects={disableHeavyEffects}
        onBack={() => logic.router.back()}
        onRestartTour={courseTour.restartTour}
        restartTourLabel={logic.t('tour.replayLabel')}
      />

      <TranslationFallbackBanner warning={logic.translationFallbackWarning} />

      <div
        className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0F1419] relative z-10"
        ref={logic.swipeRef}
        style={{
          marginRight: logic.isLiaOpen && !logic.isMobile ? '420px' : 0,
          transition: disableHeavyEffects ? 'none' : 'margin-right 0.3s ease-in-out',
        }}
      >
        <CourseLearnSidebar logic={logic} />
        <CourseContentPanel
          courseTour={courseTour}
          disableHeavyEffects={disableHeavyEffects}
          logic={logic}
        />
      </div>

      <CourseMobileNavigation
        disableHeavyEffects={disableHeavyEffects}
        logic={logic}
      />
      <LearnNoteErrorToast
        error={logic.noteError}
        onDismiss={() => logic.setNoteError(null)}
      />
      <CourseLearnModals
        courseTitle={courseTitle}
        handleValidationClose={handleValidationClose}
        logic={logic}
      />
      <CourseLiaDock
        currentLessonContext={currentLessonContext}
        logic={logic}
      />
      {logic.mounted ? <Joyride {...courseTour.joyrideProps} /> : null}
    </div>
  );
}
