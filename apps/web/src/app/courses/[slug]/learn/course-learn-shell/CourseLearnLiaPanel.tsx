'use client'

import type { StyleConfig } from '@/features/business-panel/contexts/OrganizationStylesContext'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { CourseLiaComponent } from './dynamic-components'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnLiaPanel({
  logic,
  shell,
  panelStyles,
}: {
  logic: LearnPageLogicResult
  shell: CourseLearnShellState
  panelStyles?: StyleConfig | null
}) {
  return (
    <CourseLiaComponent
      lessonId={logic.currentLesson?.lesson_id}
      lessonTitle={logic.currentLesson?.lesson_title}
      courseSlug={logic.slug}
      transcriptContent={logic.liaTranscript}
      summaryContent={logic.liaSummary}
      lessonContent={logic.currentLesson?.lesson_description}
      lessonContext={shell.currentLessonContext}
      customColors={{
        accentColor: panelStyles?.accent_color ?? logic.colors.accent,
        panelBg: panelStyles?.sidebar_background ?? panelStyles?.card_background,
        borderColor: panelStyles?.border_color,
      }}
      onSaveNote={logic.handleSaveLiaNote}
    />
  )
}
