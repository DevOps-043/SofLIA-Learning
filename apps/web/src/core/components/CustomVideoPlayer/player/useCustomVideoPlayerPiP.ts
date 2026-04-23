import { type RefObject, useEffect } from 'react';
import { shouldPauseDetachedPiP } from './video-player.utils';

interface PiPParams {
  onPiPChange?: (active: boolean) => void;
  setIsPiP: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
}

export function useCustomVideoPlayerPiP({
  onPiPChange,
  setIsPiP,
  setIsPlaying,
  videoRef,
}: PiPParams) {
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
        videoContainer && videoContainer.getBoundingClientRect().height > 0
      );

      if (shouldPauseDetachedPiP(isVideoVisible, videoElement.paused)) {
        videoElement.pause();
      } else {
        setIsPlaying(!videoElement.paused);
      }
    };

    videoElement.addEventListener(
      'enterpictureinpicture',
      handleEnterPictureInPicture
    );
    videoElement.addEventListener(
      'leavepictureinpicture',
      handleLeavePictureInPicture
    );

    return () => {
      videoElement.removeEventListener(
        'enterpictureinpicture',
        handleEnterPictureInPicture
      );
      videoElement.removeEventListener(
        'leavepictureinpicture',
        handleLeavePictureInPicture
      );
    };
  }, [onPiPChange, setIsPiP, setIsPlaying, videoRef]);
}
