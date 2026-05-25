import type { CurrentTimeRef, VideoPlayerContextValue } from "./video-content.types";

interface AttachVideoPlaybackListenersParams {
  currentTimeRef: CurrentTimeRef;
  getContext?: () => VideoPlayerContextValue | null | undefined;
  lessonId?: string;
  videoElement: HTMLVideoElement;
}

export function attachVideoPlaybackListeners({
  currentTimeRef,
  getContext,
  lessonId,
  videoElement,
}: AttachVideoPlaybackListenersParams) {
  const saveProgress = () => {
    if (lessonId) {
      getContext?.()?.saveVideoProgress?.(lessonId, videoElement.currentTime);
    }
  };
  const onPlay = () => getContext?.()?.setIsVideoPlaying(true);
  const onPause = () => {
    getContext?.()?.setIsVideoPlaying(false);
    saveProgress();
  };
  const onEnded = () => {
    getContext?.()?.setIsVideoPlaying(false);
    saveProgress();
  };
  const onEnterPiP = () => getContext?.()?.setIsPiPActive(true);
  const onLeavePiP = () => getContext?.()?.setIsPiPActive(false);
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
    getContext?.()?.setIsVideoPlaying(true);
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
