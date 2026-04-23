"use client";

import { VideoLessonDetailsCard } from "./video-content/VideoLessonDetailsCard";
import { VideoPanel } from "./video-content/VideoPanel";
import type { VideoContentProps } from "./video-content/VideoContent.types";
import { useLessonVideoPlaybackBridge } from "./video-content/useLessonVideoPlaybackBridge";
import { useVideoCompletionTransition } from "./video-content/useVideoCompletionTransition";
import { useVideoContentActions } from "./video-content/useVideoContentActions";

export function VideoContent(props: VideoContentProps) {
  const { lesson, onNavigatePrevious, onVideoCompleted } = props;

  useLessonVideoPlaybackBridge({
    lesson,
    suppressVideoPlayback: props.suppressVideoPlayback ?? false,
  });

  const handleVideoComplete = useVideoCompletionTransition({
    lessonId: lesson.lesson_id,
    onVideoCompleted,
  });
  const { handleAdvanceAction, handleCompletionAction } =
    useVideoContentActions(props);

  const previousLesson = props.getPreviousLesson();
  const nextLesson = props.getNextLesson();
  const hasVideo = Boolean(lesson.video_provider && lesson.video_provider_id);
  const hasPreviousVideo = Boolean(
    previousLesson?.video_provider && previousLesson.video_provider_id
  );
  const hasNextVideo = Boolean(
    nextLesson?.video_provider && nextLesson.video_provider_id
  );
  const isLastLesson = !nextLesson;

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <VideoPanel
        hasNextVideo={hasNextVideo}
        hasPreviousVideo={hasPreviousVideo}
        hasVideo={hasVideo}
        isLastLesson={isLastLesson}
        lesson={lesson}
        onNavigatePrevious={onNavigatePrevious}
        onPrimaryAction={
          isLastLesson ? handleCompletionAction : handleAdvanceAction
        }
        onVideoComplete={handleVideoComplete}
      />

      <VideoLessonDetailsCard
        isSummaryLoading={props.isSummaryLoading}
        isTranscriptLoading={props.isTranscriptLoading}
        lesson={lesson}
        onNoteCreated={props.onNoteCreated}
        onStatsUpdate={props.onStatsUpdate}
        slug={props.slug}
        summaryContent={props.summaryContent}
        transcriptContent={props.transcriptContent}
      />
    </div>
  );
}
