'use client'

import { useEffect, useMemo } from 'react'
import { LearnPageHeader, LearnPageMobileNav } from '@/features/courses/components/learn'
import { TourTriggerButton, useTour } from '@/features/tours'
import { courseLearnTour } from '@/features/tours/config/course-learn.tour'
import { useOptionalOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { resolveBusinessPanelActionColor } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { chooseReadableTextColor } from '@/core/theme/color-engine'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { useThemeStore } from '@/core/stores/themeStore'
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
  const orgCtx = useOptionalOrganizationStylesContext()
  const panelStyles = orgCtx?.effectiveStyles?.panel
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    return autoStartIfNeeded()
  }, [autoStartIfNeeded])

  const workspaceBgStyle = panelStyles?.background_type === 'gradient'
    ? { backgroundImage: panelStyles.background_value }
    : panelStyles?.background_value
    ? { background: panelStyles.background_value }
    : undefined

  // Compute org-aware action colors and inject them as CSS vars on the workspace root.
  // This makes them available to ALL child components (including feature-layer components
  // that can't import from app/) via style={{ color: 'var(--learn-accent)' }}.
  //   --learn-action   = contrast-adjusted button color (org accent when primary is invisible)
  //   --learn-on-action = readable text color on top of --learn-action
  //   --learn-accent   = org accent color for indicators, spinners, borders
  const learnColorVars = useMemo(() => {
    const brandColor = panelStyles?.primary_button_color
    const accentColor = panelStyles?.accent_color ?? brandColor

    if (!brandColor || !accentColor) {
      return {
        '--learn-action': isDark ? 'var(--color-accent)' : 'var(--color-primary)',
        '--learn-on-action': isDark ? 'var(--color-primary)' : '#ffffff',
        '--learn-accent': 'var(--color-accent)',
      } as React.CSSProperties
    }

    const surfaceColor = panelStyles.sidebar_background
      ?? panelStyles.card_background
      ?? (isDark ? DESIGN_HEX_COLOR.bgDark : DESIGN_HEX_COLOR.bgLight)
    const actionColor = resolveBusinessPanelActionColor({ primaryColor: brandColor, accentColor, surfaceColor })

    return {
      '--learn-action': actionColor,
      '--learn-on-action': chooseReadableTextColor(actionColor),
      '--learn-accent': accentColor,
    } as React.CSSProperties
  }, [panelStyles, isDark])

  return (
    <>
      <CourseLearnModals logic={logic} shell={shell} />
      <div
        data-tour-id="course-learn--workspace"
        className="fixed inset-0 flex h-app-dynamic flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900"
        style={{ ...workspaceBgStyle, ...learnColorVars }}
      >
        <LearnPageHeader
          courseTitle={shell.courseTitle}
          courseProgress={logic.courseProgress}
          onBack={() => logic.router.back()}
          organizationName={logic.organizationName}
          tourAction={<TourTriggerButton onStart={() => shell.restartWithIntroVideos(restartTour)} className="text-primary/70 hover:text-primary dark:text-white/70 dark:hover:text-accent" />}
          disableHeavyEffects={shell.disableHeavyEffects}
          headerBg={panelStyles?.sidebar_background}
          primaryColor={panelStyles?.primary_button_color}
          accentColor={panelStyles?.accent_color}
        />
        <TranslationWarning logic={logic} />
        <CourseLearnBody logic={logic} shell={shell} panelStyles={panelStyles} />
        <LearnPageMobileNav isVisible={logic.isMobileBottomNavVisible} isLeftPanelOpen={logic.isLeftPanelOpen} hasPreviousLesson={!!logic.getPreviousLesson()} hasNextLesson={!!logic.getNextLesson()} onOpenMaterial={logic.openLeftPanel} onCreateNote={logic.openNewNoteModal} onNavigatePrevious={logic.navigateToPreviousLesson} onNavigateNext={logic.navigateToNextLesson} disableHeavyEffects={shell.disableHeavyEffects} />
        <NoteErrorToast logic={logic} />
        <CourseLearnLiaPanel logic={logic} shell={shell} />
      </div>
      <IntroVideoOverlay shell={shell} />
    </>
  )
}
