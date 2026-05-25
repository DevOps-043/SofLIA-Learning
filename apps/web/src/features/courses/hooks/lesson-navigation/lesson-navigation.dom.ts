import type { PauseAllVideosContext } from "./lesson-navigation.types";

export function scrollToTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function saveLessonVideoProgress(
  videoPlayerContext: PauseAllVideosContext | undefined,
  lessonId?: string | null,
) {
  if (!lessonId) {
    return;
  }

  const currentVideoElement = document.querySelector(".aspect-video video") as HTMLVideoElement | null;

  if (!currentVideoElement) {
    return;
  }

  videoPlayerContext?.saveVideoProgress?.(lessonId, currentVideoElement.currentTime);
}
