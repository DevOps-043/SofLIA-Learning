import { useEffect, useRef, type RefObject } from 'react';
import { useVideoTracking } from '../../../../features/video-tracking';

/**
 * Throttle del listener nativo `timeupdate` para tracking. El evento dispara
 * varias veces por segundo; sin throttle cada disparo asigna closures y golpea
 * el downstream (que de todos modos filtra a 3s/5s). 1s es seguro y elimina el
 * churn por frame que contribuía al sobrecalentamiento en móviles.
 */
const TRACKING_TIMEUPDATE_THROTTLE_MS = 1000;

interface UseCustomVideoPlayerTrackingInput {
  enrollmentId?: string | null;
  lessonId?: string;
  onTrackingError?: (error: Error) => void;
  organizationId?: string | null;
  trackingId?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function useCustomVideoPlayerTracking({
  enrollmentId,
  lessonId,
  onTrackingError,
  organizationId,
  trackingId,
  videoRef,
}: UseCustomVideoPlayerTrackingInput): void {
  // `useVideoTracking` se llama SIEMPRE (Rules of Hooks): llamarlo dentro de un
  // ternario rompía el orden de hooks al cambiar `lessonId` (p. ej. navegar
  // entre lecciones), reconstruyendo el subárbol de hooks y re-montando los
  // listeners de video en cadena. Con `lessonId` vacío el hook existe pero el
  // efecto de listeners de abajo no engancha nada (está protegido por
  // `if (!videoElement || !lessonId) return;`).
  const tracking = useVideoTracking({
    enrollmentId,
    lessonId: lessonId ?? '',
    onError: onTrackingError,
    organizationId,
    trackingId,
  });

  const trackingRef = useRef(tracking);
  const lastTrackingTimeUpdateRef = useRef<number>(0);

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
      const now = performance.now();
      if (
        now - lastTrackingTimeUpdateRef.current <
        TRACKING_TIMEUPDATE_THROTTLE_MS
      ) {
        return;
      }
      lastTrackingTimeUpdateRef.current = now;

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
