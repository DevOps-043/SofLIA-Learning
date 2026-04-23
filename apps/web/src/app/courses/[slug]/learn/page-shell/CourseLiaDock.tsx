import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';
import { CourseLiaComponent } from './CourseLearnLazyComponents';

interface CourseLiaDockProps {
  currentLessonContext: ReturnType<LearnPageLogicResult['getLessonContext']> | undefined;
  logic: LearnPageLogicResult;
}

export function CourseLiaDock({
  currentLessonContext,
  logic,
}: CourseLiaDockProps) {
  return (
    <CourseLiaComponent
      courseSlug={logic.slug}
      customColors={{
        accentColor: logic.colors.accent,
        borderColor: 'rgba(255,255,255,0.1)',
        panelBg: logic.colors.bgSecondary,
        textPrimary: '#FFFFFF',
        textSecondary: 'rgba(255,255,255,0.6)',
      }}
      lessonContent={logic.currentLesson?.lesson_description}
      lessonContext={currentLessonContext}
      lessonId={logic.currentLesson?.lesson_id}
      lessonTitle={logic.currentLesson?.lesson_title}
      onSaveNote={logic.handleSaveLiaNote}
      summaryContent={logic.liaSummary}
      transcriptContent={logic.liaTranscript}
    />
  );
}
