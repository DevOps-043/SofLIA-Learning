import { ExpandableText } from "@/core/components/ExpandableText";
import { LessonSupplementaryContent } from "../LessonSupplementaryContent";
import styles from "../LessonSupplementaryContent.module.css";
import type { LearnLesson } from "../types";

interface LessonDetailsPanelProps {
  isSummaryLoading: boolean;
  isTranscriptLoading: boolean;
  lesson: LearnLesson;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  onStatsUpdate: (operation: "create" | "update" | "delete", lessonId?: string) => Promise<void>;
  slug: string;
  summaryContent: string | null;
  transcriptContent: string | null;
}

export function LessonDetailsPanel({
  isSummaryLoading,
  isTranscriptLoading,
  lesson,
  onNoteCreated,
  onStatsUpdate,
  slug,
  summaryContent,
  transcriptContent,
}: LessonDetailsPanelProps) {
  return (
    <section
      data-tour-id="course-learn--lesson-details"
      className={styles.detailsPanel}
    >
      <header className={styles.lessonHeader}>
        <div>
          <h2 className={styles.lessonTitle}>
            {lesson.lesson_title}
          </h2>
          {lesson.lesson_description && (
            <ExpandableText
              text={lesson.lesson_description}
              maxLines={2}
              className={styles.lessonDescription}
            />
          )}
        </div>
      </header>
      <LessonSupplementaryContent
        lesson={lesson}
        slug={slug}
        transcriptContent={transcriptContent}
        summaryContent={summaryContent}
        isTranscriptLoading={isTranscriptLoading}
        isSummaryLoading={isSummaryLoading}
        onNoteCreated={onNoteCreated}
        onStatsUpdate={onStatsUpdate}
      />
    </section>
  );
}
