import type { PauseAllVideosContext } from "./types";

const VIDEO_SELECTOR = ".aspect-video video";

export function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function saveLessonVideoProgress(
  lessonId: string | null | undefined,
  videoPlayerContext?: PauseAllVideosContext
) {
  if (!lessonId) return;

  const currentVideoElement = document.querySelector(
    VIDEO_SELECTOR
  ) as HTMLVideoElement | null;

  if (!currentVideoElement) return;

  videoPlayerContext?.saveVideoProgress?.(lessonId, currentVideoElement.currentTime);
}
