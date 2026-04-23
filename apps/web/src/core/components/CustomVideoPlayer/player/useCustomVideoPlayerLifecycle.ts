import { type RefObject, useEffect } from 'react';

interface LifecycleParams {
  containerRef: RefObject<HTMLDivElement>;
  hasNotifiedCompletionRef: { current: boolean };
  pauseWhenHidden: boolean;
  pauseWhenOutsideViewport: boolean;
  setCurrentTime: (value: number) => void;
  setDuration: (value: number) => void;
  setHasInitialTimeSet: (value: boolean) => void;
  setIsBuffering: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  src: string;
  videoRef: RefObject<HTMLVideoElement>;
}

export function useCustomVideoPlayerLifecycle({
  containerRef,
  hasNotifiedCompletionRef,
  pauseWhenHidden,
  pauseWhenOutsideViewport,
  setCurrentTime,
  setDuration,
  setHasInitialTimeSet,
  setIsBuffering,
  setIsLoading,
  setIsPlaying,
  src,
  videoRef,
}: LifecycleParams) {
  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      if (videoElement && document.pictureInPictureElement !== videoElement) {
        videoElement.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!pauseWhenHidden || !videoRef.current) return;

    const videoElement = videoRef.current;
    const handleVisibilityChange = () => {
      const isInPiP = document.pictureInPictureElement === videoElement;
      if (document.hidden && !isInPiP && !videoElement.paused) {
        videoElement.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, setIsPlaying, videoRef]);

  useEffect(() => {
    if (!pauseWhenOutsideViewport || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const containerElement = containerRef.current;
    const videoElement = videoRef.current;
    if (!containerElement || !videoElement) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isInPiP = document.pictureInPictureElement === videoElement;
      if (entry && !entry.isIntersecting && !isInPiP && !videoElement.paused) {
        videoElement.pause();
        setIsPlaying(false);
      }
    }, { threshold: 0.1 });

    observer.observe(containerElement);
    return () => observer.disconnect();
  }, [containerRef, pauseWhenOutsideViewport, setIsPlaying, src, videoRef]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setIsBuffering(false);
    setHasInitialTimeSet(false);
    hasNotifiedCompletionRef.current = false;
  }, [hasNotifiedCompletionRef, setCurrentTime, setDuration, setHasInitialTimeSet, setIsBuffering, setIsLoading, setIsPlaying, src]);
}
