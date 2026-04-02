import {
  type ForwardedRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type {
  CustomVideoPlayerController,
  CustomVideoPlayerProps,
  CustomVideoPlayerRef,
} from './types';
import {
  calculateProgressTime,
  calculateVolumeLevel,
  clampPlaybackTime,
  formatVideoTime,
  shouldPauseDetachedPiP,
  VIDEO_PLAYBACK_RATES,
} from './video-player.utils';
import { useCustomVideoPlayerTracking } from './useCustomVideoPlayerTracking';

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
      if (!videoElement) {
        return;
      }

      const isInPictureInPicture = document.pictureInPictureElement === videoElement;

      if (!isInPictureInPicture) {
        videoElement.pause();
      }
    };
  }, []);

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
  }, [src]);

  useImperativeHandle(
    ref,
    () => ({
      exitPiP: async () => {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiP(false);
          onPiPChange?.(false);
        }
      },
      getVideoElement: () => videoRef.current,
      isPiPActive: () => isPiP,
      isPlaying: () => isPlaying,
      requestPiP: async () => {
        const videoElement = videoRef.current;

        if (!videoElement || document.pictureInPictureElement) {
          return;
        }

        await videoElement.requestPictureInPicture();
        setIsPiP(true);
        onPiPChange?.(true);
      },
    }),
    [isPiP, isPlaying, onPiPChange]
  );

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

  useEffect(() => {
    if (!isHovering && isPlaying && showControls) {
      const hideControlsTimeout = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);

      return () => window.clearTimeout(hideControlsTimeout);
    }
  }, [isHovering, isPlaying, showControls]);

  useEffect(() => {
    if (isHovering) {
      setShowControls(true);
    }
  }, [isHovering]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    let bufferingTimeout: ReturnType<typeof setTimeout> | null = null;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);

      if (onProgress && duration > 0) {
        onProgress((videoElement.currentTime / duration) * 100);
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
      setIsPlaying(false);
      onComplete?.();
    };

    const handleWaiting = () => {
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
      }

      bufferingTimeout = setTimeout(() => {
        setIsBuffering(true);
      }, 300);
    };

    const handleCanPlay = () => {
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
        bufferingTimeout = null;
      }

      setIsBuffering(false);
      setIsLoading(false);

      if (!hasInitialTimeSet && initialTime > 0) {
        videoElement.currentTime = initialTime;
        setHasInitialTimeSet(true);
      }

      if (Math.abs(videoElement.playbackRate - initialPlaybackRate) > 0.01) {
        videoElement.playbackRate = initialPlaybackRate;
      }
    };

    const handlePlaying = () => {
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
        bufferingTimeout = null;
      }

      setIsBuffering(false);
    };

    const handleNativePlay = () => setIsPlaying(true);
    const handleNativePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', updateTime);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('play', handleNativePlay);
    videoElement.addEventListener('pause', handleNativePause);

    return () => {
      if (bufferingTimeout) {
        clearTimeout(bufferingTimeout);
      }

      videoElement.removeEventListener('timeupdate', updateTime);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
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
      videoElement.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoElement.volume = 0;
      setIsMuted(true);
    }

    setShowControls(true);
  };

  const toggleFullscreen = async () => {
    const containerElement = containerRef.current;

    if (!containerElement) {
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
          await webkitContainer.webkitRequestFullscreen?.();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else {
        const webkitDocument = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
        };
        await webkitDocument.webkitExitFullscreen?.();
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
      if (!isDraggingProgress) {
        updateProgress(event.clientX);
        setShowControls(true);
      }
    },
    handleProgressMouseDown: (event) => {
      event.preventDefault();
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
    handleVideoLoadedData: () => setIsLoading(false),
    handleVideoLoadStart: () => setIsLoading(true),
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
    onRootMouseEnter: () => setIsHovering(true),
    onRootMouseLeave: () => setIsHovering(false),
    onRootMouseMove: () => setShowControls(true),
    playbackRate,
    playbackRates: VIDEO_PLAYBACK_RATES,
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
