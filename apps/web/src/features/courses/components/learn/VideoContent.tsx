"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";

import { ExpandableText } from "../../../../core/components/ExpandableText";
import { COURSE_LEARN_TOUR_TARGET_IDS } from "../../../../core/constants/tourTargets";
import { useVideoPlayerOptional } from "../../../../app/courses/[slug]/learn/VideoPlayerContext";
import {
  hasIncompleteActivities,
  isLessonVideoCompleted,
} from "../../hooks/lessonNavigation.utils";
import { LessonSupplementaryContent } from "./LessonSupplementaryContent";
import type {
  LearnActivitySummary,
  LearnLesson,
  LearnTab,
} from "./types";

const VideoPlayer = dynamic(
  () =>
    import("../../../../core/components/VideoPlayer").then((mod) => ({
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

type VideoContentProps = {
  lesson: LearnLesson;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void | Promise<void>;
  onVideoCompleted: (lessonId: string) => void;
  getPreviousLesson: () => LearnLesson | null;
  getNextLesson: () => LearnLesson | null;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  canCompleteLesson: (lessonId: string) => boolean;
  onCourseCompleted: () => void;
  onCannotComplete: () => void;
  hasActivities: boolean;
  activities: LearnActivitySummary[];
  isSummaryLoading: boolean;
  isTranscriptLoading: boolean;
  onNoteCreated: (noteData: unknown, lessonId: string) => void;
  setActiveTab: (tab: LearnTab) => void;
  onStatsUpdate: (
    operation: "create" | "update" | "delete",
    lessonId?: string
  ) => Promise<void>;
  slug: string;
  summaryContent: string | null;
  transcriptContent: string | null;
};

const VIDEO_COMPLETION_TRANSITION_DELAY_MS = 1000;

type VideoResumeApiResponse = {
  checkpointSeconds?: number;
  playbackRate?: number;
};

async function fetchVideoResumeData(lessonId: string): Promise<{
  checkpointSeconds: number;
  playbackRate: number;
}> {
  try {
    const response = await fetch(`/api/video-tracking/resume/${lessonId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      return {
        checkpointSeconds: 0,
        playbackRate: 1,
      };
    }

    const data = (await response.json()) as VideoResumeApiResponse;

    return {
      checkpointSeconds:
        typeof data.checkpointSeconds === "number" ? data.checkpointSeconds : 0,
      playbackRate:
        typeof data.playbackRate === "number" && data.playbackRate > 0
          ? data.playbackRate
          : 1,
    };
  } catch {
    return {
      checkpointSeconds: 0,
      playbackRate: 1,
    };
  }
}

export function VideoContent({
  lesson,
  onNavigatePrevious,
  onNavigateNext,
  onVideoCompleted,
  getPreviousLesson,
  getNextLesson,
  markLessonAsCompleted,
  canCompleteLesson,
  onCourseCompleted,
  onCannotComplete,
  hasActivities,
  activities,
  isSummaryLoading,
  isTranscriptLoading,
  onNoteCreated,
  setActiveTab,
  onStatsUpdate,
  slug,
  summaryContent,
  transcriptContent,
}: VideoContentProps) {
  const videoPlayerContext = useVideoPlayerOptional();
  const currentTimeRef = useRef(0);
  const autoPlayedForLessonRef = useRef<string | null>(null);
  const completionTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVideoComplete = useCallback(() => {
    if (!lesson.lesson_id) {
      return;
    }

    if (completionTransitionTimeoutRef.current !== null) {
      clearTimeout(completionTransitionTimeoutRef.current);
    }

    completionTransitionTimeoutRef.current = setTimeout(() => {
      completionTransitionTimeoutRef.current = null;
      onVideoCompleted(lesson.lesson_id);
    }, VIDEO_COMPLETION_TRANSITION_DELAY_MS);
  }, [lesson.lesson_id, onVideoCompleted]);

  const hasVideo = Boolean(lesson.video_provider && lesson.video_provider_id);
  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();
  const hasPreviousLesson = previousLesson !== null;
  const hasNextLesson = nextLesson !== null;
  const hasPreviousVideo = Boolean(
    hasPreviousLesson &&
      previousLesson?.video_provider &&
      previousLesson?.video_provider_id
  );
  const hasNextVideo = Boolean(
    hasNextLesson && nextLesson?.video_provider && nextLesson?.video_provider_id
  );
  const isLastLesson = !hasNextLesson;

  useEffect(() => {
    return () => {
      if (completionTransitionTimeoutRef.current !== null) {
        clearTimeout(completionTransitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasVideo || !lesson.lesson_id) {
      return;
    }

    if (autoPlayedForLessonRef.current === lesson.lesson_id) {
      return;
    }

    let cancelled = false;
    const retryIds: ReturnType<typeof setTimeout>[] = [];

    const tryAutoPlay = () => {
      if (cancelled) {
        return;
      }

      const video = document.querySelector(".aspect-video video") as
        | HTMLVideoElement
        | null;

      if (!video) {
        videoPlayerContext?.setShouldAutoPlay(true);
        autoPlayedForLessonRef.current = lesson.lesson_id;
        return;
      }

      if (!video.paused) {
        autoPlayedForLessonRef.current = lesson.lesson_id;
        return;
      }

      video.muted = false;
      video.play().then(
        () => {
          autoPlayedForLessonRef.current = lesson.lesson_id;
        },
        () => {
          video.muted = true;
          video.play().then(() => {
            autoPlayedForLessonRef.current = lesson.lesson_id;
          }, () => undefined);
        }
      );
    };

    const waitAndTry = () => {
      if (cancelled) {
        return;
      }

      const video = document.querySelector(".aspect-video video") as
        | HTMLVideoElement
        | null;

      if (!video) {
        return;
      }

      if (video.readyState >= 3) {
        tryAutoPlay();
        return;
      }

      video.addEventListener("canplay", tryAutoPlay, { once: true });
    };

    waitAndTry();

    [500, 1000, 2000].forEach((delay) => {
      const timeoutId = setTimeout(() => {
        if (cancelled || autoPlayedForLessonRef.current === lesson.lesson_id) {
          return;
        }

        waitAndTry();
      }, delay);

      retryIds.push(timeoutId);
    });

    return () => {
      cancelled = true;
      retryIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideo, lesson.lesson_id]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let isSetup = false;
    let isDisposed = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let currentVideoElement: HTMLVideoElement | null = null;
    const videoContext = videoPlayerContext;

    const findVideoElement = () =>
      document.querySelector(".aspect-video video") as HTMLVideoElement | null;

    const setupVideoListeners = () => {
      if (isSetup) {
        return true;
      }

      const videoElement = findVideoElement();

      if (!videoElement) {
        return false;
      }

      currentVideoElement = videoElement;
      isSetup = true;

      if (videoContext && lesson.lesson_id) {
        const restoreAndPlay = async () => {
          const shouldPlay = videoContext.shouldAutoPlayRef?.current || false;
          const cachedTime = videoContext.getVideoProgress(lesson.lesson_id);
          let resumeCheckpoint = cachedTime;
          let resumePlaybackRate = 1;

          if (resumeCheckpoint <= 0 && !isLessonVideoCompleted(lesson)) {
            const resumeData = await fetchVideoResumeData(lesson.lesson_id);

            if (isDisposed) {
              return;
            }

            resumeCheckpoint = resumeData.checkpointSeconds;
            resumePlaybackRate = resumeData.playbackRate;

            if (resumeCheckpoint > 0) {
              videoContext.saveVideoProgress?.(
                lesson.lesson_id,
                resumeCheckpoint
              );
            }
          }

          if (
            resumePlaybackRate > 0 &&
            Math.abs(videoElement.playbackRate - resumePlaybackRate) > 0.01
          ) {
            videoElement.playbackRate = resumePlaybackRate;
          }

          if (resumeCheckpoint > 0 && videoElement.currentTime <= 0.5) {
            videoElement.currentTime = resumeCheckpoint;
            currentTimeRef.current = resumeCheckpoint;
          }

          if (shouldPlay) {
            videoElement.play().catch(() => undefined);
            videoContext.setShouldAutoPlay(false);
          }
        };

        if (videoElement.readyState >= 3) {
          void restoreAndPlay();
        } else if (videoElement.readyState >= 1) {
          videoElement.addEventListener(
            "canplay",
            () => {
              void restoreAndPlay();
            },
            {
              once: true,
            }
          );
        } else {
          videoElement.addEventListener(
            "loadedmetadata",
            () => {
              if (videoElement.readyState >= 3) {
                void restoreAndPlay();
                return;
              }

              videoElement.addEventListener(
                "canplay",
                () => {
                  void restoreAndPlay();
                },
                {
                  once: true,
                }
              );
            },
            { once: true }
          );
        }
      }

      const onPlay = () => {
        videoContext?.setIsVideoPlaying(true);
      };
      const onPause = () => {
        videoContext?.setIsVideoPlaying(false);
        if (lesson.lesson_id) {
          videoContext?.saveVideoProgress?.(
            lesson.lesson_id,
            videoElement.currentTime
          );
        }
      };
      const onEnded = () => {
        videoContext?.setIsVideoPlaying(false);
        if (lesson.lesson_id) {
          videoContext?.saveVideoProgress?.(
            lesson.lesson_id,
            videoElement.currentTime
          );
        }
      };
      const onEnterPiP = () => {
        videoContext?.setIsPiPActive(true);
      };
      const onLeavePiP = () => {
        videoContext?.setIsPiPActive(false);
      };
      const onTimeUpdate = () => {
        currentTimeRef.current = videoElement.currentTime;
      };

      videoElement.addEventListener("play", onPlay);
      videoElement.addEventListener("pause", onPause);
      videoElement.addEventListener("ended", onEnded);
      videoElement.addEventListener("enterpictureinpicture", onEnterPiP);
      videoElement.addEventListener("leavepictureinpicture", onLeavePiP);
      videoElement.addEventListener("timeupdate", onTimeUpdate);

      if (!videoElement.paused) {
        videoContext?.setIsVideoPlaying(true);
      }

      cleanupFn = () => {
        videoElement.removeEventListener("play", onPlay);
        videoElement.removeEventListener("pause", onPause);
        videoElement.removeEventListener("ended", onEnded);
        videoElement.removeEventListener("enterpictureinpicture", onEnterPiP);
        videoElement.removeEventListener("leavepictureinpicture", onLeavePiP);
        videoElement.removeEventListener("timeupdate", onTimeUpdate);

        if (lesson.lesson_id) {
          videoContext?.saveVideoProgress?.(
            lesson.lesson_id,
            videoElement.currentTime
          );
        }

        const isInPiP = document.pictureInPictureElement === videoElement;
        if (!videoElement.paused && !isInPiP) {
          videoElement.pause();
        }
      };

      return true;
    };

    const found = setupVideoListeners();

    if (!found) {
      retryTimeoutId = setTimeout(() => {
        if (!isSetup) {
          setupVideoListeners();
        }
      }, 500);

      const fallbackTimeoutId = setTimeout(() => {
        if (!isSetup) {
          setupVideoListeners();
        }
      }, 1500);

      const previousCleanup = cleanupFn;
      cleanupFn = () => {
        clearTimeout(fallbackTimeoutId);
        previousCleanup?.();
      };
    }

    return () => {
      isDisposed = true;

      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }

      cleanupFn?.();

      const isInPiP =
        currentVideoElement &&
        document.pictureInPictureElement === currentVideoElement;
      if (currentVideoElement && !currentVideoElement.paused && !isInPiP) {
        currentVideoElement.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.lesson_id]);

  const handleCompletionAction = async () => {
    if (!lesson.lesson_id || !canCompleteLesson(lesson.lesson_id)) {
      onCannotComplete();
      return;
    }

    const success = await markLessonAsCompleted(lesson.lesson_id);

    if (success) {
      onCourseCompleted();
    }
  };

  const handleAdvanceAction = () => {
    const pendingExists = hasIncompleteActivities(activities);

    if (hasActivities && pendingExists) {
      setActiveTab("activities");
      return;
    }

    onNavigateNext();
  };

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <div
        id={COURSE_LEARN_TOUR_TARGET_IDS.videoPanel}
        className="relative w-full"
      >
        {hasVideo ? (
          <div className="aspect-video rounded-xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 relative bg-[#0F1419] dark:bg-[#0F1419]">
            <VideoPlayer
              videoProvider={lesson.video_provider!}
              videoProviderId={lesson.video_provider_id!}
              title={lesson.lesson_title}
              className="w-full h-full"
              lessonId={lesson.lesson_id}
              onComplete={handleVideoComplete}
            />
            <VideoNavigationOverlay
              hasPreviousVideo={hasPreviousVideo}
              hasNextVideo={hasNextVideo}
              isLastLesson={isLastLesson}
              onNavigatePrevious={onNavigatePrevious}
              onPrimaryAction={
                isLastLesson ? handleCompletionAction : handleAdvanceAction
              }
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#0A2540]/20 to-[#00D4B3]/20 rounded-xl flex items-center justify-center border border-[#E9ECEF] dark:border-[#6C757D]/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540]/10 via-[#00D4B3]/10 to-[#00D4B3]/10 animate-pulse" />
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-[#0A2540] rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-[#0d2f4d] transition-all transform group-hover:scale-110">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-gray-700 dark:text-white/70">
                Video no disponible
              </p>
            </div>
            <VideoNavigationOverlay
              hasPreviousVideo={hasPreviousVideo}
              hasNextVideo={hasNextVideo}
              isLastLesson={isLastLesson}
              onNavigatePrevious={onNavigatePrevious}
              onPrimaryAction={
                isLastLesson ? handleCompletionAction : handleAdvanceAction
              }
            />
          </div>
        )}
      </div>

      <div
        className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6"
      >
        <div className="space-y-4">
          <div>
            <h2
              className="text-2xl font-bold text-[#0A2540] dark:text-white"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              {lesson.lesson_title}
            </h2>
            {lesson.lesson_description && (
              <ExpandableText
                text={lesson.lesson_description}
                maxLines={2}
                className="mt-2"
              />
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
    </div>
  );
}

type VideoNavigationOverlayProps = {
  hasPreviousVideo: boolean;
  hasNextVideo: boolean;
  isLastLesson: boolean;
  onNavigatePrevious: () => void;
  onPrimaryAction: () => void | Promise<void>;
};

function VideoNavigationOverlay({
  hasPreviousVideo,
  hasNextVideo,
  isLastLesson,
  onNavigatePrevious,
  onPrimaryAction,
}: VideoNavigationOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
      {hasPreviousVideo && (
        <button
          onClick={onNavigatePrevious}
          className="pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
            Anterior
          </span>
        </button>
      )}

      {(hasNextVideo || isLastLesson) && (
        <button
          onClick={onPrimaryAction}
          className={`pointer-events-auto h-10 sm:h-12 rounded-full text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
            isLastLesson
              ? "bg-[#0A2540]/55 hover:bg-[#0A2540]/75 border border-[#0A2540]/35 dark:bg-[#00D4B3]/35 dark:hover:bg-[#00D4B3]/55 dark:border-[#00D4B3]/30"
              : "bg-[#0A2540]/50 hover:bg-[#0A2540]/70 border border-[#0A2540]/30"
          }`}
        >
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
            {isLastLesson ? "Terminar" : "Siguiente"}
          </span>
          {isLastLesson ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
          )}
        </button>
      )}
    </div>
  );
}
