import type { MutableRefObject, RefObject } from 'react';

export interface NativeVideoEventsParams {
  duration: number;
  hasInitialTimeSet: boolean;
  hasNotifiedCompletionRef: MutableRefObject<boolean>;
  initialPlaybackRate: number;
  initialTime: number;
  lastTimeupdateRenderRef: MutableRefObject<number>;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  setCurrentTime: (value: number) => void;
  setDuration: (value: number) => void;
  setHasInitialTimeSet: (value: boolean) => void;
  setIsBuffering: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
}
