import { type RefObject, useEffect } from 'react';
import { exitPlayerFullscreen, requestPlayerFullscreen } from './fullscreen.utils';

interface FullscreenParams {
  containerRef: RefObject<HTMLDivElement>;
  isFullscreen: boolean;
  isPlaying: boolean;
  setIsFullscreen: (value: boolean) => void;
  setShowControls: (value: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
}

export function useCustomVideoPlayerFullscreen({
  containerRef,
  isFullscreen,
  isPlaying,
  setIsFullscreen,
  setShowControls,
  videoRef,
}: FullscreenParams) {
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      const videoElement = videoRef.current;
      setIsFullscreen(isNowFullscreen);

      if (videoElement && isPlaying && videoElement.paused) {
        void videoElement.play().catch(() => undefined);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isPlaying, setIsFullscreen, videoRef]);

  return async () => {
    const containerElement = containerRef.current;
    const videoElement = videoRef.current;
    if (!containerElement || !videoElement) return;

    try {
      if (isFullscreen) await exitPlayerFullscreen(videoElement);
      else await requestPlayerFullscreen(containerElement, videoElement);
    } finally {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setShowControls(true);
    }
  };
}
