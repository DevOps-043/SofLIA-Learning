import { useEffect, type RefObject } from 'react';

interface UseFullscreenSyncOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}

/**
 * Syncs React's isFullscreen flag with the browser's fullscreen API
 * events.  Also resumes playback when entering fullscreen if the
 * browser paused the video as part of the transition (some Safari
 * versions do this).
 *
 * Listens for both the standard `fullscreenchange` and the WebKit
 * vendor-prefixed variant — iOS Safari only fires the prefixed one.
 */
export function useFullscreenSync({
  videoRef,
  isPlaying,
  setIsFullscreen,
}: UseFullscreenSyncOptions): void {
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFullscreen);

      const videoElement = videoRef.current;
      if (videoElement && isPlaying && videoElement.paused) {
        void videoElement.play().catch(() => undefined);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange as EventListener,
    );

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange as EventListener,
      );
    };
  }, [isPlaying, videoRef, setIsFullscreen]);
}
