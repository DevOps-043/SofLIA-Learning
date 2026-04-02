import { useEffect, useRef, type RefObject } from 'react';
import { useVideoTracking } from '../../../../features/video-tracking';

interface UseCustomVideoPlayerTrackingInput {
  lessonId?: string;
  onTrackingError?: (error: Error) => void;
  trackingId?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function useCustomVideoPlayerTracking({
  lessonId,
  onTrackingError,
  trackingId,
  videoRef,
}: UseCustomVideoPlayerTrackingInput): void {
  const tracking = lessonId
    ? useVideoTracking({
        lessonId,
        onError: onTrackingError,
        trackingId,
      })
    : null;

  const trackingRef = useRef(tracking);

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement || !lessonId) {
      return;
    }

    const handlePlayEvent = () => {
      trackingRef.current?.handlePlay(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    const handlePauseEvent = () => {
      trackingRef.current?.handlePause(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    const handleEndedEvent = () => {
      trackingRef.current?.handleEnded(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    const handleSeekedEvent = () => {
      trackingRef.current?.handleSeeked(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    const handleTimeUpdateEvent = () => {
      trackingRef.current?.handleTimeUpdate(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    const handleRateChangeEvent = () => {
      trackingRef.current?.handleRateChange(
        videoElement.currentTime,
        videoElement.duration,
        videoElement.playbackRate
      );
    };

    videoElement.addEventListener('play', handlePlayEvent);
    videoElement.addEventListener('pause', handlePauseEvent);
    videoElement.addEventListener('ended', handleEndedEvent);
    videoElement.addEventListener('seeked', handleSeekedEvent);
    videoElement.addEventListener('timeupdate', handleTimeUpdateEvent);
    videoElement.addEventListener('ratechange', handleRateChangeEvent);

    return () => {
      trackingRef.current?.cleanup();
      videoElement.removeEventListener('play', handlePlayEvent);
      videoElement.removeEventListener('pause', handlePauseEvent);
      videoElement.removeEventListener('ended', handleEndedEvent);
      videoElement.removeEventListener('seeked', handleSeekedEvent);
      videoElement.removeEventListener('timeupdate', handleTimeUpdateEvent);
      videoElement.removeEventListener('ratechange', handleRateChangeEvent);
    };
  }, [lessonId, videoRef]);
}
