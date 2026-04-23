import dynamic from 'next/dynamic';
import { COURSE_LEARN_TOUR_TARGET_IDS } from '@/core/constants/tourTargets';
import type { LearnLesson } from '../types';
import { VideoNavigationOverlay } from './VideoNavigationOverlay';
import { VideoUnavailablePanel } from './VideoUnavailablePanel';

const VideoPlayer = dynamic(
  () =>
    import('@/core/components/VideoPlayer').then((mod) => ({
      default: mod.VideoPlayer,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center aspect-video bg-[#0F1419] dark:bg-[#0F1419] rounded-xl">
        Cargando video...
      </div>
    ),
    ssr: false,
  }
);

interface VideoPanelProps {
  hasNextVideo: boolean;
  hasPreviousVideo: boolean;
  hasVideo: boolean;
  isLastLesson: boolean;
  lesson: LearnLesson;
  onNavigatePrevious: () => void;
  onPrimaryAction: () => void | Promise<void>;
  onVideoComplete: () => void;
}

export function VideoPanel({
  hasNextVideo,
  hasPreviousVideo,
  hasVideo,
  isLastLesson,
  lesson,
  onNavigatePrevious,
  onPrimaryAction,
  onVideoComplete,
}: VideoPanelProps) {
  const overlay = (
    <VideoNavigationOverlay
      hasNextVideo={hasNextVideo}
      hasPreviousVideo={hasPreviousVideo}
      isLastLesson={isLastLesson}
      onNavigatePrevious={onNavigatePrevious}
      onPrimaryAction={onPrimaryAction}
    />
  );

  return (
    <div id={COURSE_LEARN_TOUR_TARGET_IDS.videoPanel} className="relative w-full">
      {hasVideo ? (
        <div className="aspect-video rounded-xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 relative bg-[#0F1419] dark:bg-[#0F1419]">
          <VideoPlayer
            className="w-full h-full"
            lessonId={lesson.lesson_id}
            onComplete={onVideoComplete}
            playbackContext="lesson"
            title={lesson.lesson_title}
            videoProvider={lesson.video_provider!}
            videoProviderId={lesson.video_provider_id!}
          />
          {overlay}
        </div>
      ) : (
        <div className="relative">
          <VideoUnavailablePanel />
          {overlay}
        </div>
      )}
    </div>
  );
}
