import type { RefObject } from 'react';

import type { MediaPlaybackContext } from '@/lib/media';
import type { CustomVideoPlayerRef } from '../CustomVideoPlayer/CustomVideoPlayer';

export interface VideoPlayerProps {
  className?: string;
  initialPlaybackRate?: number;
  initialTime?: number;
  lessonId?: string;
  onComplete?: () => void;
  onPiPChange?: (isPiP: boolean) => void;
  onProgress?: (progress: number) => void;
  playbackContext?: MediaPlaybackContext;
  seekControlsLocked?: boolean;
  title?: string;
  trackingId?: string;
  videoProvider: 'youtube' | 'vimeo' | 'direct' | 'custom';
  videoProviderId: string;
}

export interface ProviderPlayerProps {
  className?: string;
  initialPlaybackRate?: number;
  initialTime?: number;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  playbackContext?: MediaPlaybackContext;
  title?: string;
  videoId: string;
}

export interface VideoContentStateProps {
  customVideoRef: RefObject<CustomVideoPlayerRef>;
  error: string | null;
  hasActivatedEmbed: boolean;
  isLoading: boolean;
  setError: (value: string | null) => void;
  setHasActivatedEmbed: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  videoUrl: string;
}
