import type {
  Dispatch,
  MouseEvent,
  RefObject,
  SetStateAction,
  SyntheticEvent,
  TouchEvent,
} from 'react';
import type { NativeVideoPreload } from '@/lib/media';

export interface CustomVideoPlayerProps {
  className?: string;
  initialPlaybackRate?: number;
  initialTime?: number;
  lessonId?: string;
  onComplete?: () => void;
  onPiPChange?: (isPiP: boolean) => void;
  onProgress?: (progress: number) => void;
  onTrackingError?: (error: Error) => void;
  pauseWhenHidden?: boolean;
  pauseWhenOutsideViewport?: boolean;
  preload?: NativeVideoPreload;
  src: string;
  title?: string;
  trackingId?: string;
}

export interface CustomVideoPlayerRef {
  exitPiP: () => Promise<void>;
  getVideoElement: () => HTMLVideoElement | null;
  isPiPActive: () => boolean;
  isPlaying: () => boolean;
  requestPiP: () => Promise<void>;
}

export interface CustomVideoPlayerController {
  changePlaybackRate: (rate: number) => void;
  className: string;
  containerRef: RefObject<HTMLDivElement>;
  currentTime: number;
  duration: number;
  formatTime: (seconds: number) => string;
  handleVideoError: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
  handleVideoLoadedData: () => void;
  handleVideoLoadStart: () => void;
  handleProgressClick: (event: MouseEvent<HTMLDivElement>) => void;
  handleProgressMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  handleProgressMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  handleProgressMouseUp: () => void;
  handleProgressTouchEnd: () => void;
  handleProgressTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  handleProgressTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  handleVolumeClick: (event: MouseEvent<HTMLDivElement>) => void;
  handleVolumeMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  handleVolumeMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  handleVolumeMouseUp: () => void;
  handleVolumeTouchEnd: () => void;
  handleVolumeTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  handleVolumeTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  isBuffering: boolean;
  isDraggingProgress: boolean;
  isFullscreen: boolean;
  isHovering: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isPiP: boolean;
  isPlaying: boolean;
  onRootMouseEnter: () => void;
  onRootMouseLeave: () => void;
  onRootMouseMove: () => void;
  playbackRate: number;
  playbackRates: number[];
  preload: NativeVideoPreload;
  progressBarRef: RefObject<HTMLDivElement>;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setShowVolumeControl: Dispatch<SetStateAction<boolean>>;
  showControls: boolean;
  showSettings: boolean;
  showVolumeControl: boolean;
  skip: (seconds: number) => void;
  src: string;
  title?: string;
  toggleFullscreen: () => Promise<void>;
  toggleMute: () => void;
  togglePictureInPicture: () => Promise<void>;
  togglePlay: () => Promise<void>;
  videoRef: RefObject<HTMLVideoElement>;
  volume: number;
  volumeBarRef: RefObject<HTMLDivElement>;
}
