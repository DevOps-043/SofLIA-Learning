'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import { CourseLiaComponent } from './dynamic-components'
import type { CourseLearnShellState } from './useCourseLearnShellState'

export function CourseLearnLiaPanel({ logic, shell }: { logic: LearnPageLogicResult; shell: CourseLearnShellState }) {
  return (
    <CourseLiaComponent lessonId={logic.currentLesson?.lesson_id} lessonTitle={logic.currentLesson?.lesson_title} courseSlug={logic.slug} transcriptContent={logic.liaTranscript} summaryContent={logic.liaSummary} lessonContent={logic.currentLesson?.lesson_description} lessonContext={shell.currentLessonContext} customColors={{ accentColor: logic.colors.accent }} onSaveNote={logic.handleSaveLiaNote} />
  )
}
