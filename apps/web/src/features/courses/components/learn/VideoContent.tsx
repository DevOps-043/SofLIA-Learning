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
import { useVideoPlayerOptional } from "../../../../app/courses/[slug]/learn/VideoPlayerContext";
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
  getPreviousLesson: () => LearnLesson | null;
  getNextLesson: () => LearnLesson | null;
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>;
  canCompleteLesson: (lessonId: string) => boolean;
  onCourseCompleted: () => void;
  onCannotComplete: () => void;
  hasActivities: boolean;
  activities: LearnActivitySummary[];
  setActiveTab: (tab: LearnTab) => void;
};

export function VideoContent({
  lesson,
  onNavigatePrevious,
  onNavigateNext,
  getPreviousLesson,
  getNextLesson,
  markLessonAsCompleted,
  canCompleteLesson,
  onCourseCompleted,
  onCannotComplete,
  hasActivities,
  activities,
  setActiveTab,
}: VideoContentProps) {
  const videoPlayerContext = useVideoPlayerOptional();
  const currentTimeRef = useRef(0);
  const activitiesSectionRef = useRef<HTMLDivElement>(null);
  const autoPlayedForLessonRef = useRef<string | null>(null);

  const handleVideoComplete = useCallback(() => {
    const pendingActivities = activities.filter((activity) => !activity.is_completed);

    setTimeout(() => {
      if (hasActivities && pendingActivities.length > 0) {
        setActiveTab("activities");
        return;
      }

      onNavigateNext();
    }, 3000);
  }, [activities, hasActivities, onNavigateNext, setActiveTab]);

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
        const savedTime = videoContext.getVideoProgress(lesson.lesson_id);

        const restoreAndPlay = () => {
          const shouldPlay = videoContext.shouldAutoPlayRef?.current || false;

          if (savedTime > 0) {
            videoElement.currentTime = savedTime;
          }

          if (shouldPlay) {
            videoElement.play().catch(() => undefined);
            videoContext.setShouldAutoPlay(false);
          }
        };

        if (videoElement.readyState >= 3) {
          restoreAndPlay();
        } else if (videoElement.readyState >= 1) {
          videoElement.addEventListener("canplay", restoreAndPlay, {
            once: true,
          });
        } else {
          videoElement.addEventListener(
            "loadedmetadata",
            () => {
              if (videoElement.readyState >= 3) {
                restoreAndPlay();
                return;
              }

              videoElement.addEventListener("canplay", restoreAndPlay, {
                once: true,
              });
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
      };
      const onEnded = () => {
        videoContext?.setIsVideoPlaying(false);
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
    } else {
      onCannotComplete();
    }
  };

  const handleAdvanceAction = () => {
    const pendingExists = activities.some((activity) => !activity.is_completed);

    if (hasActivities && pendingExists) {
      setActiveTab("activities");
      return;
    }

    onNavigateNext();
  };

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <div className="relative w-full">
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
              onPrimaryAction={isLastLesson ? handleCompletionAction : onNavigateNext}
            />
          </div>
        )}
      </div>

      <div
        ref={activitiesSectionRef}
        className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6"
      >
        <h2
          className="text-2xl font-bold text-[#0A2540] dark:text-white mb-4"
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
          className={`pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
            isLastLesson ? "bg-[#10B981]/50 hover:bg-[#10B981]/70" : ""
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
