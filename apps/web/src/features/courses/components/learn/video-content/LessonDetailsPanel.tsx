import { ExpandableText } from "@/core/components/ExpandableText";
import { LessonSupplementaryContent } from "../LessonSupplementaryContent";
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-500/30 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
            {lesson.lesson_title}
          </h2>
          {lesson.lesson_description && (
            <ExpandableText text={lesson.lesson_description} maxLines={2} className="mt-2" />
          )}
        </div>
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
      </div>
    </div>
  );
}
