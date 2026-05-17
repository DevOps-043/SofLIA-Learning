import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";

interface AttachVideoPlaybackListenersParams {
  context?: VideoPlayerContextValue | null;
  currentTimeRef: CurrentTimeRef;
  lessonId?: string;
  videoElement: HTMLVideoElement;
}

export function attachVideoPlaybackListeners({
  context,
  currentTimeRef,
  lessonId,
  videoElement,
}: AttachVideoPlaybackListenersParams) {
  const saveProgress = () => {
    if (lessonId) {
      context?.saveVideoProgress?.(lessonId, videoElement.currentTime);
    }
  };
  const onPlay = () => context?.setIsVideoPlaying(true);
  const onPause = () => {
    context?.setIsVideoPlaying(false);
    saveProgress();
  };
  const onEnded = () => {
    context?.setIsVideoPlaying(false);
    saveProgress();
  };
  const onEnterPiP = () => context?.setIsPiPActive(true);
  const onLeavePiP = () => context?.setIsPiPActive(false);
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
    context?.setIsVideoPlaying(true);
  }

  return () => {
    videoElement.removeEventListener("play", onPlay);
    videoElement.removeEventListener("pause", onPause);
    videoElement.removeEventListener("ended", onEnded);
    videoElement.removeEventListener("enterpictureinpicture", onEnterPiP);
    videoElement.removeEventListener("leavepictureinpicture", onLeavePiP);
    videoElement.removeEventListener("timeupdate", onTimeUpdate);
    saveProgress();

    const isInPiP = document.pictureInPictureElement === videoElement;
    if (!videoElement.paused && !isInPiP) {
      videoElement.pause();
    }
  };
}
