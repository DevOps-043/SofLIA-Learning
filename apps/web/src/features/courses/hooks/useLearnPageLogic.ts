'use client'

import { useState } from 'react'

import { buildLearnPageLogicResult, useLearnPageBase, useLearnPageCompletionActions, useLearnPageDataLoader, useLearnPageLayout, useLearnPageLessonContext, useLearnPageMobileMetrics, useLearnPageNavigationSetup, useLearnPageOrderedLessons, useLearnPagePrompts, useLearnPageState, useLearnPageTabGuard, useLearnPageTabs, useLearnPageTranslationFallback, useLearnPageVideoAutoRedirect, useLearnPageVideoCompletion, useLearnPageVideoTransition, useLearnPageWorkshopHelp } from './learn-page'
import { useLessonCompletion } from './useLessonCompletion'
import { useLessonSidebarState } from './useLessonSidebarState'
import { useNotesManagement } from './useNotesManagement'
import { useUserBehaviorLog } from './useUserBehaviorLog'

/**
 * Top-level orchestrator for the course learning page.
 *
 * Composes the following domain hooks in dependency order:
 *   1. base          — slug, language, closeLia, videoPlayerContext
 *   2. state         — course, modules, currentLesson, progress, LIA transcript
 *   3. layout        — activeTab, isMobile, handleTabChange
 *   4. sidebar       — lesson list, notes collapse, translation contexts
 *   5. mobile        — mobile-specific viewport metrics
 *   6. notes         — note CRUD, stats, modals
 *   7. behavior      — user behavior event logging
 *   8. prompts       — tab-aware AI prompt suggestions
 *   9. videoCompletion — video-driven lesson completion signals
 *  10. ordered        — ordered lesson list, canCompleteLesson guard
 *  11. validation     — lesson completion + quiz validation
 *  12. completion     — post-completion flow (certificates, ratings)
 *  13. navigation     — lesson navigation actions and preloading
 *  14. lessonContext  — assembled lesson data for rendering
 *  15. workshopHelp   — workshop-specific side panel
 *  16. tabs           — tab definitions (i18n)
 *  17. translationFallbackWarning — missing translation detection
 *
 * Returns a flat object via `buildLearnPageLogicResult`. Use `LearnPageLogicResult`
 * as the type for prop-drilling or context consumers.
 */
export function useLearnPageLogic() {
  const base = useLearnPageBase()
  const state = useLearnPageState()
  const layout = useLearnPageLayout({ currentLesson: state.currentLesson, videoPlayerContext: base.videoPlayerContext })
  const sidebar = useLessonSidebarState({ slug: base.slug, selectedLang: base.selectedLang, modules: state.modules, currentLesson: state.currentLesson, isMobile: layout.isMobile })
  const mobile = useLearnPageMobileMetrics({ layout, sidebar })
  const notes = useNotesManagement({ slug: base.slug, modules: state.modules, currentLesson: state.currentLesson, isNotesCollapsed: sidebar.isNotesCollapsed, closeLia: base.closeLia })
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false)

  useLearnPageDataLoader({ base, state, notes })

  const behavior = useUserBehaviorLog(state.currentLesson)
  const prompts = useLearnPagePrompts(layout.activeTab)
  const videoCompletion = useLearnPageVideoCompletion({ loadLessonActivitiesAndMaterials: sidebar.loadLessonActivitiesAndMaterials, setCurrentLesson: state.setCurrentLesson, setModules: state.setModules })

  useLearnPageVideoAutoRedirect({ layout, sidebar, currentLesson: state.currentLesson })
  const ordered = useLearnPageOrderedLessons(state.modules, state.currentLesson)
  const validation = useLessonCompletion({ slug: base.slug, currentLesson: state.currentLesson, modules: state.modules, setModules: state.setModules, setCurrentLesson: state.setCurrentLesson, setCourseProgress: state.setCourseProgress, canCompleteLesson: ordered.canCompleteLesson })
  const completion = useLearnPageCompletionActions({ base, course: state.course, currentLesson: state.currentLesson, markLessonAsCompleted: validation.markLessonAsCompleted, canCompleteLesson: ordered.canCompleteLesson })
  const handleTabChange = useLearnPageTabGuard({ layout, validation, behavior, currentLesson: state.currentLesson })
  const navigation = useLearnPageNavigationSetup({ base, behavior, layout, ordered, sidebar, state, validation })

  useLearnPageVideoTransition({ layout, sidebar, navigation, currentLesson: state.currentLesson, videoCompletion })
  const lessonContext = useLearnPageLessonContext({ base, state, layout, sidebar, prompts, notes })
  const workshopHelp = useLearnPageWorkshopHelp({ base, state, layout, sidebar, behavior, lessonContext })
  const tabs = useLearnPageTabs(base.t)
  const translationFallbackWarning = useLearnPageTranslationFallback({
    currentLesson: state.currentLesson,
    learnDataTranslationContext: state.learnDataTranslationContext,
    lessonTranslationContexts: sidebar.lessonTranslationContexts,
    selectedLang: base.selectedLang,
  })

  return buildLearnPageLogicResult({
    base,
    state,
    layout: { ...layout, handleTabChange },
    mobile,
    sidebar,
    notes,
    ordered,
    validation,
    navigation,
    completion,
    prompts,
    videoCompletion,
    lessonContext,
    workshopHelp,
    ui: { tabs, translationFallbackWarning, isClearHistoryModalOpen, setIsClearHistoryModalOpen },
    behavior,
  })
}

export type LearnPageLogicResult = ReturnType<typeof useLearnPageLogic>
