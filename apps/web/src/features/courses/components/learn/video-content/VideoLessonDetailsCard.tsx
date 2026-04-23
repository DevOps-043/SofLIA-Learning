import { ExpandableText } from '@/core/components/ExpandableText';
import { LessonSupplementaryContent } from '../LessonSupplementaryContent';
import type { VideoContentProps } from './VideoContent.types';

type VideoLessonDetailsCardProps = Pick<
  VideoContentProps,
  | 'isSummaryLoading'
  | 'isTranscriptLoading'
  | 'lesson'
  | 'onNoteCreated'
  | 'onStatsUpdate'
  | 'slug'
  | 'summaryContent'
  | 'transcriptContent'
>;

export function VideoLessonDetailsCard({
  isSummaryLoading,
  isTranscriptLoading,
  lesson,
  onNoteCreated,
  onStatsUpdate,
  slug,
  summaryContent,
  transcriptContent,
}: VideoLessonDetailsCardProps) {
  return (
    <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6">
      <div className="space-y-4">
        <div>
          <h2
            className="text-2xl font-bold text-[#0A2540] dark:text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
          >
            {lesson.lesson_title}
          </h2>
          {lesson.lesson_description && (
            <ExpandableText text={lesson.lesson_description} maxLines={2} className="mt-2" />
          )}
        </div>

        <LessonSupplementaryContent
          isSummaryLoading={isSummaryLoading}
          isTranscriptLoading={isTranscriptLoading}
          lesson={lesson}
          onNoteCreated={onNoteCreated}
          onStatsUpdate={onStatsUpdate}
          slug={slug}
          summaryContent={summaryContent}
          transcriptContent={transcriptContent}
        />
      </div>
    </div>
  );
}
