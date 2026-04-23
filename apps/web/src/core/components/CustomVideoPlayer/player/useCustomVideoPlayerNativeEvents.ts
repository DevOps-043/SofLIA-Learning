import { useEffect } from 'react';
import { createCustomVideoNativeHandlers } from './customVideoNativeHandlers';
import type { NativeVideoEventsParams } from './native-events.types';

export function useCustomVideoPlayerNativeEvents(
  params: NativeVideoEventsParams
) {
  useEffect(() => {
    const videoElement = params.videoRef.current;
    if (!videoElement) return;

    const nativeEvents = createCustomVideoNativeHandlers(videoElement, params);
    nativeEvents.attach();
    return nativeEvents.detach;
  }, [
    params.duration,
    params.hasInitialTimeSet,
    params.initialPlaybackRate,
    params.initialTime,
    params.onComplete,
    params.onProgress,
    params.videoRef,
  ]);
}
