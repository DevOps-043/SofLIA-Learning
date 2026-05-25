import { useEffect, type RefObject } from 'react';

interface UseVideoAutoPauseOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  pauseWhenHidden: boolean;
  pauseWhenOutsideViewport: boolean;
  src: string;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Pauses the video automatically in three cases:
 *
 * 1. Component unmount — but never when the video is in Picture-in-Picture
 *    (the floating PiP window should keep playing).
 * 2. Tab becomes hidden (visibilitychange) — same PiP exception.
 * 3. Element scrolls out of viewport (IntersectionObserver) when the
 *    consumer opts in via pauseWhenOutsideViewport.
 *
 * Kept as one hook because the three cases share the same "is in PiP?"
 * predicate and the same "pause + sync isPlaying" effect.
 */
export function useVideoAutoPause({
  videoRef,
  containerRef,
  pauseWhenHidden,
  pauseWhenOutsideViewport,
  src,
  setIsPlaying,
}: UseVideoAutoPauseOptions): void {
  // 1. Pause on unmount (except when in PiP).
  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      if (!videoElement) return;
      if (document.pictureInPictureElement !== videoElement) videoElement.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Pause when the document becomes hidden.
  useEffect(() => {
    if (!pauseWhenHidden) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      const isInPiP = document.pictureInPictureElement === videoElement;
      if (!isInPiP && !videoElement.paused) {
        videoElement.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, videoRef, setIsPlaying]);

  // 3. Pause when the container scrolls out of viewport.
  useEffect(() => {
    if (!pauseWhenOutsideViewport || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const containerElement = containerRef.current;
    const videoElement = videoRef.current;
    if (!containerElement || !videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.isIntersecting) return;
        const isInPiP = document.pictureInPictureElement === videoElement;
        if (!isInPiP && !videoElement.paused) {
          videoElement.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(containerElement);
    return () => observer.disconnect();
  }, [pauseWhenOutsideViewport, src, videoRef, containerRef, setIsPlaying]);
}
