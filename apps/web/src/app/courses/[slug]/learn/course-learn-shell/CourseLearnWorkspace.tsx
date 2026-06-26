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

  // Org background: prefer card_background, fall back to sidebar_background.
  // Read directly from panelStyles (synchronous — initialStyles from server means no timing issues).
  // Same pattern as CourseSidebarPanel: { backgroundColor: sidebarBg }.
  // Use sidebar_background first (darkened primary, e.g. pure black for Valora IT).
  // card_background is intentionally lighter (22% primary + 78% gray800) and would look
  // grayish compared to the sidebar — not what the org branding intends.
  const orgPanelBg = panelStyles?.sidebar_background ?? panelStyles?.card_background ?? null
  const orgBorderColor = panelStyles?.border_color ?? null

  // Workspace outer background: prefer explicit background_value (custom image/gradient/color),
  // then org panel bg, then leave undefined so Tailwind dark-mode classes take over.
  const workspaceBgStyle: React.CSSProperties =
    panelStyles?.background_type === 'gradient' && panelStyles.background_value
      ? { backgroundImage: panelStyles.background_value }
      : panelStyles?.background_value
      ? { background: panelStyles.background_value }
      : orgPanelBg
      ? { background: orgPanelBg }
      : {}

  // Inject --learn-* CSS vars on the workspace root so ALL descendant components
  // (including feature-layer components that can't import from app/) can use them.
  //   --learn-action      = contrast-adjusted primary action color
  //   --learn-on-action   = readable text on top of --learn-action
  //   --learn-accent      = org accent color (indicators, borders, spinners)
  //   --learn-body-bg     = scrollable content area background
  //   --learn-card-bg     = lesson panel / tabs bar / details card background
  //   --learn-card-border = lesson panel card borders
  const learnColorVars = useMemo(() => {
    const brandColor = panelStyles?.primary_button_color
    const accentColor = panelStyles?.accent_color ?? brandColor

    // Direct values (no CSS var cascade): same color the sidebar uses, available on first render.
    const bodyBg = orgPanelBg ?? (isDark ? 'var(--color-bg-dark)' : 'var(--color-bg-light)')
    const cardBg = orgPanelBg ?? (isDark ? 'var(--color-bg-dark)' : 'var(--color-bg-light)')
    const cardBorder = orgBorderColor ?? (isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-gray-200)')

    if (!brandColor || !accentColor) {
      return {
        '--learn-action': isDark ? 'var(--color-accent)' : 'var(--color-primary)',
        '--learn-on-action': isDark ? 'var(--color-primary)' : '#ffffff',
        '--learn-accent': 'var(--color-accent)',
        '--learn-body-bg': bodyBg,
        '--learn-card-bg': cardBg,
        '--learn-card-border': cardBorder,
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
      '--learn-body-bg': bodyBg,
      '--learn-card-bg': cardBg,
      '--learn-card-border': cardBorder,
    } as React.CSSProperties
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelStyles, isDark, orgPanelBg, orgBorderColor])

  return (
    <>
      <CourseLearnModals logic={logic} shell={shell} />
      <div
        data-tour-id="course-learn--workspace"
        className={`fixed inset-0 flex h-app-dynamic flex-col overflow-hidden${orgPanelBg ? '' : ' bg-gradient-to-br from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'}`}
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
        <CourseLearnLiaPanel logic={logic} shell={shell} panelStyles={panelStyles} />
      </div>
      <IntroVideoOverlay shell={shell} />
    </>
  )
}
