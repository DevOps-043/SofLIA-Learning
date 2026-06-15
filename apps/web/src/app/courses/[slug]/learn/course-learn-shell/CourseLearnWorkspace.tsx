'use client'

import { useEffect } from 'react'
import { LearnPageHeader, LearnPageMobileNav } from '@/features/courses/components/learn'
import { TourTriggerButton, useTour } from '@/features/tours'
import { courseLearnTour } from '@/features/tours/config/course-learn.tour'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { CourseLearnBody } from './CourseLearnBody'
import { CourseLearnLiaPanel } from './CourseLearnLiaPanel'
import { CourseLearnModals } from './CourseLearnModals'
import { IntroVideoOverlay } from './IntroVideoOverlay'
import { NoteErrorToast } from './NoteErrorToast'
import { TranslationWarning } from './TranslationWarning'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnWorkspace({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  const { restartTour, autoStartIfNeeded } = useTour(courseLearnTour)

  useEffect(() => {
    return autoStartIfNeeded()
  }, [autoStartIfNeeded])

  return (
    <>
      <CourseLearnModals logic={logic} shell={shell} />
      <div data-tour-id="course-learn--workspace" className="fixed inset-0 flex h-app-dynamic flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <LearnPageHeader
          courseTitle={shell.courseTitle}
          courseProgress={logic.courseProgress}
          onBack={() => logic.router.back()}
          organizationName={logic.organizationName}
          tourAction={<TourTriggerButton onStart={() => shell.restartWithIntroVideos(restartTour)} className="text-primary/70 hover:text-primary dark:text-white/70 dark:hover:text-accent" />}
          disableHeavyEffects={shell.disableHeavyEffects}
        />
        <TranslationWarning logic={logic} />
        <CourseLearnBody logic={logic} shell={shell} />
        <LearnPageMobileNav isVisible={logic.isMobileBottomNavVisible} isLeftPanelOpen={logic.isLeftPanelOpen} hasPreviousLesson={!!logic.getPreviousLesson()} hasNextLesson={!!logic.getNextLesson()} onOpenMaterial={logic.openLeftPanel} onCreateNote={logic.openNewNoteModal} onNavigatePrevious={logic.navigateToPreviousLesson} onNavigateNext={logic.navigateToNextLesson} disableHeavyEffects={shell.disableHeavyEffects} />
        <NoteErrorToast logic={logic} />
        <CourseLearnLiaPanel logic={logic} shell={shell} />
      </div>
      <IntroVideoOverlay shell={shell} />
    </>
  )
}
