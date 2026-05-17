'use client'

import { Joyride } from 'react-joyride'
import { COURSE_LEARN_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'
import { CourseAccessGuard } from '@/features/courses/components/CourseAccessGuard'
import { LearnPageHeader, LearnPageMobileNav } from '@/features/courses/components/learn'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { CourseLearnBody } from './CourseLearnBody'
import { CourseLearnLiaPanel } from './CourseLearnLiaPanel'
import { CourseLearnModals } from './CourseLearnModals'
import { IntroVideoOverlay } from './IntroVideoOverlay'
import { NoteErrorToast } from './NoteErrorToast'
import { TranslationWarning } from './TranslationWarning'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnWorkspace({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <>
      <CourseAccessGuard courseSlug={logic.slug}>
        <CourseLearnModals logic={logic} shell={shell} />
        <div id={COURSE_LEARN_TOUR_TARGET_IDS.workspace} className="fixed inset-0 flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          <LearnPageHeader courseTitle={shell.courseTitle} courseProgress={logic.courseProgress} onBack={() => logic.router.back()} onRestartTour={shell.courseTour.restartTour} restartTourLabel={logic.t('tour.replayLabel')} disableHeavyEffects={shell.disableHeavyEffects} />
          <TranslationWarning logic={logic} />
          <CourseLearnBody logic={logic} shell={shell} />
          <LearnPageMobileNav isVisible={logic.isMobileBottomNavVisible} isLeftPanelOpen={logic.isLeftPanelOpen} hasPreviousLesson={!!logic.getPreviousLesson()} hasNextLesson={!!logic.getNextLesson()} onOpenMaterial={logic.openLeftPanel} onNavigatePrevious={logic.navigateToPreviousLesson} onNavigateNext={logic.navigateToNextLesson} disableHeavyEffects={shell.disableHeavyEffects} />
          <NoteErrorToast logic={logic} />
          <CourseLearnLiaPanel logic={logic} shell={shell} />
          {logic.mounted && shell.courseTour.run ? <Joyride {...shell.courseTour.joyrideProps} /> : null}
        </div>
      </CourseAccessGuard>
      <IntroVideoOverlay shell={shell} />
    </>
  )
}
