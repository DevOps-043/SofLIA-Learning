import { useEffect, type RefObject } from 'react';

import { shouldPauseDetachedPiP } from '../video-player.utils';

interface UseVideoPictureInPictureOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  onPiPChange?: (isPiP: boolean) => void;
  setIsPiP: (isPiP: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Wires Picture-in-Picture lifecycle events from the native <video>
 * element back into React state.
 *
 * On leave-PiP, decides whether to pause or keep playing based on
 * whether the player's container is currently visible — when the
 * detached PiP window closes while the original container is hidden
 * (e.g. user closed the lesson tab), the video should pause; when
 * the container is visible (user returned to the lesson), playback
 * continues seamlessly.
 */
export function useVideoPictureInPicture({
  videoRef,
  onPiPChange,
  setIsPiP,
  setIsPlaying,
}: UseVideoPictureInPictureOptions): void {
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnterPictureInPicture = () => {
      setIsPiP(true);
      onPiPChange?.(true);
    };

    const handleLeavePictureInPicture = () => {
      setIsPiP(false);
      onPiPChange?.(false);

      const videoContainer = videoElement.closest('.aspect-video');
      const isVideoVisible = Boolean(
        videoContainer && videoContainer.getBoundingClientRect().height > 0,
      );

      if (shouldPauseDetachedPiP(isVideoVisible, videoElement.paused)) {
        videoElement.pause();
      } else {
        setIsPlaying(!videoElement.paused);
      }
    };

    videoElement.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    videoElement.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      videoElement.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
    };
  }, [onPiPChange, videoRef, setIsPiP, setIsPlaying]);
}
