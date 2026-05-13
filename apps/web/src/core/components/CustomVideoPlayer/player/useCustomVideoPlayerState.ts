import {
  type ForwardedRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCustomVideoPlayerImperativeHandle } from './useCustomVideoPlayerImperativeHandle';
import type {
  CustomVideoPlayerController,
  CustomVideoPlayerProps,
  CustomVideoPlayerRef,
} from './types';
import {
  NATIVE_VIDEO_BUFFERING_DELAY_MS,
  NATIVE_VIDEO_STALLED_DELAY_MS,
  hasNativeVideoPlayableData,
  isNativeVideoWaitingForPlayableData,
} from '@/lib/media';
import {
  calculateProgressTime,
  calculateVolumeLevel,
  clampPlaybackTime,
  formatVideoTime,
  shouldPauseDetachedPiP,
  VIDEO_PLAYBACK_RATES,
} from './video-player.utils';
import { useCustomVideoPlayerTracking } from './useCustomVideoPlayerTracking';

const VIDEO_COMPLETION_EPSILON_SECONDS = 0.25;
const VIDEO_COMPLETION_PROGRESS_THRESHOLD = 0.995;

export function useCustomVideoPlayerState(
  {
    className = '',
    initialPlaybackRate = 1,
    initialTime = 0,
    lessonId,
    onComplete,
    onPiPChange,
    onProgress,
    onTrackingError,
    pauseWhenHidden = true,
    pauseWhenOutsideViewport = false,
    preload = 'metadata',
    seekControlsLocked = false,
    src,
    title,
    trackingId,
  }: CustomVideoPlayerProps,
  ref: ForwardedRef<CustomVideoPlayerRef>
): CustomVideoPlayerController {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const hasNotifiedCompletionRef = useRef(false);
  // Throttle timeupdate → React re-renders to max ~4 fps (250 ms).
  // The completion check still runs every native timeupdate event.
  const lastTimeupdateRenderRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [hasInitialTimeSet, setHasInitialTimeSet] = useState(false);

  useCustomVideoPlayerTracking({
    lessonId,
    onTrackingError,
    trackingId,
    videoRef,
  });

  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      if (!videoElement) return;
      if (document.pictureInPictureElement !== videoElement) videoElement.pause();
    };
  }, []);

  useEffect(() => {
    if (!pauseWhenHidden) {
      return;
    }

    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        return;
      }

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
  }, [pauseWhenHidden]);

  useEffect(() => {
    if (!pauseWhenOutsideViewport || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const containerElement = containerRef.current;
    const videoElement = videoRef.current;

    if (!containerElement || !videoElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.isIntersecting) {
          return;
        }

        const isInPiP = document.pictureInPictureElement === videoElement;
        if (!isInPiP && !videoElement.paused) {
          videoElement.pause();
          setIsPlaying(false);
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(containerElement);

    return () => {
      observer.disconnect();
    };
  }, [pauseWhenOutsideViewport, src]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setIsBuffering(false);
    setHasInitialTimeSet(false);
    hasNotifiedCompletionRef.current = false;
  }, [src]);

  useCustomVideoPlayerImperativeHandle({ ref, isPiP, isPlaying, videoRef, setIsPiP, onPiPChange });

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    const handleEnterPictureInPicture = () => {
      setIsPiP(true);
      onPiPChange?.(true);
    };

    const handleLeavePictureInPicture = () => {
      setIsPiP(false);
      onPiPChange?.(false);

      const videoContainer = videoElement.closest('.aspect-video');
      const isVideoVisible = Boolean(
        videoContainer && videoContainer.getBoundingClientRect().height > 0
      );

      if (shouldPauseDetachedPiP(isVideoVisible, videoElement.paused)) {
        videoElement.pause();
      } else {
        setIsPlaying(!videoElement.paused);
      }
    };

    videoElement.addEventListener(
      'enterpictureinpicture',
      handleEnterPictureInPicture
    );
    videoElement.addEventListener(
      'leavepictureinpicture',
      handleLeavePictureInPicture
    );

    return () => {
      videoElement.removeEventListener(
        'enterpictureinpicture',
        handleEnterPictureInPicture
      );
      videoElement.removeEventListener(
        'leavepictureinpicture',
        handleLeavePictureInPicture
      );
    };
  }, [onPiPChange]);

  const timeoutRef = useRef<number | null>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setIsHovering(false); 
    }, 3000);
  }, []);

  useEffect(() => {
    if (isHovering || isPlaying) {
      resetControlsTimeout();
    }
    if (!isPlaying) {
      setShowControls(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    }
  }, [isHovering, isPlaying, resetControlsTimeout]);

  useEffect(() => {
    if (seekControlsLocked) {
      setIsDraggingProgress(false);
    }
  }, [seekControlsLocked]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    let bufferingIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearBufferingTimeout = () => {
      if (bufferingIndicatorTimeout) {
        clearTimeout(bufferingIndicatorTimeout);
        bufferingIndicatorTimeout = null;
      }
    };

    const markVideoResponsive = () => {
      clearBufferingTimeout();
      setIsBuffering(false);
      setIsLoading(false);
    };

    const scheduleBufferingIndicator = (delayMs: number) => {
      clearBufferingTimeout();
      bufferingIndicatorTimeout = setTimeout(() => {
        bufferingIndicatorTimeout = null;
        if (isNativeVideoWaitingForPlayableData(videoElement)) {
          setIsBuffering(true);
        }
      }, delayMs);
    };

    const notifyCompletion = () => {
      if (hasNotifiedCompletionRef.current) {
        return;
      }

      hasNotifiedCompletionRef.current = true;
      onComplete?.();
    };

    const updateTime = () => {
      const playbackTime = videoElement.currentTime;
      markVideoResponsive();

      // ── Completion check — runs every timeupdate (no throttle) ──────────
      if (duration > 0 && !videoElement.paused && !videoElement.ended) {
        const remainingTime = duration - playbackTime;
        const progressRatio = playbackTime / duration;

        if (
          remainingTime <= VIDEO_COMPLETION_EPSILON_SECONDS ||
          progressRatio >= VIDEO_COMPLETION_PROGRESS_THRESHOLD
        ) {
          notifyCompletion();
        }
      }

      // ── React state update — throttled to ≤250 ms intervals ─────────────
      // timeupdate fires ~4 Hz natively; without throttling each event
      // triggers a full React re-render of the player component tree,
      // which causes continuous CPU wake-ups on mobile → device heating.
      const now = performance.now();
      if (now - lastTimeupdateRenderRef.current < 250) return;
      lastTimeupdateRenderRef.current = now;

      setCurrentTime(playbackTime);

      if (onProgress && duration > 0) {
        onProgress((playbackTime / duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);

      if (!hasInitialTimeSet && initialTime > 0) {
        videoElement.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }

      if (Math.abs(videoElement.playbackRate - initialPlaybackRate) > 0.01) {
        videoElement.playbackRate = initialPlaybackRate;
      }
    };

    const handleEnded = () => {
      markVideoResponsive();
      setIsPlaying(false);
      notifyCompletion();
    };

    const handleWaiting = () => {
      scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS);
    };

    const handleStalled = () => {
      // Safari can emit "stalled" during normal bandwidth management. Avoid
      // synthetic seeks here: they wake the decoder and can increase heat on iOS.
      scheduleBufferingIndicator(NATIVE_VIDEO_STALLED_DELAY_MS);
    };

    const handleCanPlay = () => {
      markVideoResponsive();

      if (!hasInitialTimeSet && initialTime > 0) {
        videoElement.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }

      if (Math.abs(videoElement.playbackRate - initialPlaybackRate) > 0.01) {
        videoElement.playbackRate = initialPlaybackRate;
      }
    };

    const handlePlaying = () => {
      markVideoResponsive();
      setIsPlaying(true);
    };

    const handleProgress = () => {
      if (hasNativeVideoPlayableData(videoElement)) {
        markVideoResponsive();
      }
    };

    const handleNativePlay = () => {
      setIsPlaying(true);
      if (hasNativeVideoPlayableData(videoElement)) {
        markVideoResponsive();
        return;
      }

      scheduleBufferingIndicator(NATIVE_VIDEO_BUFFERING_DELAY_MS);
    };
    const handleNativePause = () => {
      clearBufferingTimeout();
      setIsBuffering(false);
      setIsPlaying(false);
    };

    videoElement.addEventListener('timeupdate', updateTime);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('loadeddata', markVideoResponsive);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('canplaythrough', markVideoResponsive);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('seeked', handleProgress);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('play', handleNativePlay);
    videoElement.addEventListener('pause', handleNativePause);

    return () => {
      clearBufferingTimeout();

      videoElement.removeEventListener('timeupdate', updateTime);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('loadeddata', markVideoResponsive);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('stalled', handleStalled);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('canplaythrough', markVideoResponsive);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('seeked', handleProgress);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('play', handleNativePlay);
      videoElement.removeEventListener('pause', handleNativePause);
    };
  }, [
    duration,
    hasInitialTimeSet,
    initialPlaybackRate,
    initialTime,
    onComplete,
    onProgress,
  ]);

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
      handleFullscreenChange as EventListener
    );

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange as EventListener
      );
    };
  }, [isPlaying]);

  const updateProgress = (clientX: number) => {
    if (seekControlsLocked) {
      return;
    }

    const videoElement = videoRef.current;
    const progressBarElement = progressBarRef.current;

    if (!videoElement || !progressBarElement || duration === 0) {
      return;
    }

    const rect = progressBarElement.getBoundingClientRect();
    const nextTime = calculateProgressTime(clientX, rect.left, rect.width, duration);
    videoElement.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const updateVolume = (clientY: number) => {
    const videoElement = videoRef.current;
    const volumeBarElement = volumeBarRef.current;

    if (!videoElement || !volumeBarElement) {
      return;
    }

    const rect = volumeBarElement.getBoundingClientRect();
    const nextVolume = calculateVolumeLevel(clientY, rect.bottom, rect.height);
    videoElement.volume = nextVolume;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingProgress) {
        event.preventDefault();
        updateProgress(event.clientX);
      }

      if (isDraggingVolume) {
        event.preventDefault();
        updateVolume(event.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume]);

  const togglePlay = async () => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    try {
      if (isPlaying) {
        videoElement.pause();
        setIsPlaying(false);
      } else {
        await videoElement.play();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }

    setShowControls(true);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    if (isMuted) {
      videoElement.muted = false;
      videoElement.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoElement.muted = true;
      videoElement.volume = 0;
      setIsMuted(true);
    }

    setShowControls(true);
  };

  const toggleFullscreen = async () => {
    const containerElement = containerRef.current;
    const videoElement = videoRef.current;

    if (!containerElement || !videoElement) {
      return;
    }

    try {
      if (!isFullscreen) {
        if (containerElement.requestFullscreen) {
          await containerElement.requestFullscreen();
        } else {
          const webkitContainer = containerElement as HTMLDivElement & {
            webkitRequestFullscreen?: () => Promise<void>;
          };
          if (webkitContainer.webkitRequestFullscreen) {
            await webkitContainer.webkitRequestFullscreen();
          } else {
            // Fallback for iOS iPhone (native video fullscreen)
            const webkitVideo = videoElement as HTMLVideoElement & {
              webkitEnterFullscreen?: () => void;
            };
            webkitVideo.webkitEnterFullscreen?.();
          }
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else {
        const webkitDocument = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
        };
        if (webkitDocument.webkitExitFullscreen) {
          await webkitDocument.webkitExitFullscreen();
        } else {
          // Fallback for iOS iPhone (native video exit fullscreen)
          const webkitVideo = videoElement as HTMLVideoElement & {
            webkitExitFullscreen?: () => void;
          };
          webkitVideo.webkitExitFullscreen?.();
        }
      }
    } finally {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setShowControls(true);
    }
  };

  const togglePictureInPicture = async () => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoElement.requestPictureInPicture();
    }

    setShowSettings(false);
    setShowControls(true);
  };

  const changePlaybackRate = (rate: number) => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setShowControls(true);
  };

  const skip = (seconds: number) => {
    if (seekControlsLocked && seconds > 0) {
      setShowControls(true);
      return;
    }

    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.currentTime = clampPlaybackTime(
      videoElement.currentTime,
      duration,
      seconds
    );
    setCurrentTime(videoElement.currentTime);
    setShowControls(true);
  };

  return {
    changePlaybackRate,
    className,
    containerRef,
    currentTime,
    duration,
    formatTime: formatVideoTime,
    handleProgressClick: (event) => {
      if (seekControlsLocked) {
        setShowControls(true);
        return;
      }

      if (!isDraggingProgress) {
        updateProgress(event.clientX);
        setShowControls(true);
      }
    },
    handleProgressMouseDown: (event) => {
      event.preventDefault();
      if (seekControlsLocked) {
        setShowControls(true);
        return;
      }

      setIsDraggingProgress(true);
      updateProgress(event.clientX);
      setShowControls(true);
    },
    handleProgressMouseMove: (event) => {
      if (isDraggingProgress) {
        event.preventDefault();
        updateProgress(event.clientX);
      }
    },
    handleProgressMouseUp: () => setIsDraggingProgress(false),
    handleProgressTouchEnd: () => setIsDraggingProgress(false),
    handleProgressTouchMove: (event) => {
      if (!isDraggingProgress) {
        return;
      }

      event.preventDefault();
      const touch = event.touches[0];
      if (touch) {
        updateProgress(touch.clientX);
      }
    },
    handleProgressTouchStart: (event) => {
      event.preventDefault();
      if (seekControlsLocked) {
        setShowControls(true);
        return;
      }

      setIsDraggingProgress(true);
      const touch = event.touches[0];
      if (touch) {
        updateProgress(touch.clientX);
      }
      setShowControls(true);
    },
    handleVideoError: () => {
      setIsLoading(false);
      setIsBuffering(false);
    },
    handleVideoLoadedData: () => {
      setIsLoading(false);
      setIsBuffering(false);
    },
    handleVideoLoadStart: () => {
      setIsLoading(true);
      setIsBuffering(false);
    },
    handleVolumeClick: (event) => {
      if (!isDraggingVolume) {
        updateVolume(event.clientY);
      }
    },
    handleVolumeMouseDown: (event) => {
      event.preventDefault();
      setIsDraggingVolume(true);
      updateVolume(event.clientY);
      setShowVolumeControl(true);
    },
    handleVolumeMouseMove: (event) => {
      if (isDraggingVolume) {
        event.preventDefault();
        updateVolume(event.clientY);
      }
    },
    handleVolumeMouseUp: () => setIsDraggingVolume(false),
    handleVolumeTouchEnd: () => setIsDraggingVolume(false),
    handleVolumeTouchMove: (event) => {
      if (!isDraggingVolume) {
        return;
      }

      event.preventDefault();
      const touch = event.touches[0];
      if (touch) {
        updateVolume(touch.clientY);
      }
    },
    handleVolumeTouchStart: (event) => {
      event.preventDefault();
      setIsDraggingVolume(true);
      const touch = event.touches[0];
      if (touch) {
        updateVolume(touch.clientY);
      }
      setShowVolumeControl(true);
    },
    isBuffering,
    isDraggingProgress,
    isFullscreen,
    isHovering,
    isLoading,
    isMuted,
    isPiP,
    isPlaying,
    isSeekingLocked: seekControlsLocked,
    onRootMouseEnter: () => setIsHovering(true),
    onRootMouseLeave: () => setIsHovering(false),
    onRootMouseMove: () => {
      setShowControls(true);
      if (isPlaying) resetControlsTimeout();
    },
    playbackRate,
    playbackRates: VIDEO_PLAYBACK_RATES,
    preload,
    progressBarRef,
    setShowSettings,
    setShowVolumeControl,
    showControls,
    showSettings,
    showVolumeControl,
    skip,
    src,
    title,
    toggleFullscreen,
    toggleMute,
    togglePictureInPicture,
    togglePlay,
    videoRef,
    volume,
    volumeBarRef,
  };
}
