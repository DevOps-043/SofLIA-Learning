import type { CourseLearnShellChildProps } from './CourseLearnPageShell.types';
import { ActiveLessonTabContent } from './ActiveLessonTabContent';
import { EmptyCourseContentState } from './EmptyCourseContentState';
import { LessonLoadingState } from './LessonLoadingState';
import { LessonTabsBar } from './LessonTabsBar';

export function CourseContentPanel(props: CourseLearnShellChildProps) {
  const { disableHeavyEffects, logic } = props;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1E2329] rounded-lg my-0 md:my-2 mx-0 md:mx-2 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 ${disableHeavyEffects ? '' : 'backdrop-blur-sm shadow-xl'}`}>
      {logic.modules.length === 0 ? (
        <EmptyCourseContentState />
      ) : logic.currentLesson ? (
        <>
          <LessonTabsBar
            activeTab={logic.activeTab}
            handleTabChange={logic.handleTabChange}
            isMobile={logic.isMobile}
            tabs={logic.tabs}
          />
          <ActiveLessonTabContent {...props} />
        </>
      ) : (
        <LessonLoadingState t={logic.t} />
      )}
    </div>
  );
}
