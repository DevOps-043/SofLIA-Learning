import { useCallback, type RefObject } from 'react';

import { clampPlaybackTime } from '../video-player.utils';

interface UseVideoActionsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  seekControlsLocked: boolean;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setShowControls: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setCurrentTime: (time: number) => void;
}

interface UseVideoActionsResult {
  togglePlay: () => Promise<void>;
  toggleMute: () => void;
  toggleFullscreen: () => Promise<void>;
  togglePictureInPicture: () => Promise<void>;
  changePlaybackRate: (rate: number) => void;
  skip: (seconds: number) => void;
}

/**
 * Imperative actions the player exposes to the controls UI.
 *
 * Each action is a small, focused operation that mutates the native
 * <video> element and syncs the resulting state back to React.  The
 * fullscreen action carries the bulk of the complexity because it
 * has to handle three APIs (standard, WebKit-prefixed container,
 * iOS-prefixed video element).
 */
export function useVideoActions({
  videoRef,
  containerRef,
  duration,
  volume,
  isMuted,
  isPlaying,
  isFullscreen,
  seekControlsLocked,
  setIsPlaying,
  setIsMuted,
  setIsFullscreen,
  setShowControls,
  setShowSettings,
  setPlaybackRate,
  setCurrentTime,
}: UseVideoActionsOptions): UseVideoActionsResult {
  const togglePlay = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

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
  }, [isPlaying, videoRef, setIsPlaying, setShowControls]);

  const toggleMute = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

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
  }, [isMuted, volume, videoRef, setIsMuted, setShowControls]);

  const toggleFullscreen = useCallback(async () => {
    const containerElement = containerRef.current;
    const videoElement = videoRef.current;
    if (!containerElement || !videoElement) return;

    const webkitVideo = videoElement as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitExitFullscreen?: () => void;
    };

    const enterNativeVideoFullscreen = () => {
      if (typeof webkitVideo.webkitEnterFullscreen === 'function') {
        webkitVideo.webkitEnterFullscreen();
      }
    };

    try {
      if (!isFullscreen) {
        try {
          if (containerElement.requestFullscreen) {
            await containerElement.requestFullscreen();
          } else {
            const webkitContainer = containerElement as HTMLDivElement & {
              webkitRequestFullscreen?: () => Promise<void>;
            };
            if (webkitContainer.webkitRequestFullscreen) {
              await webkitContainer.webkitRequestFullscreen();
            } else {
              // iOS iPhone fallback: native video element fullscreen.
              enterNativeVideoFullscreen();
            }
          }
        } catch {
          // The browser can reject element fullscreen (request not tied to a
          // user gesture, embedded in an iframe without `allow="fullscreen"`,
          // or a restrictive Permissions-Policy). Fall back to native <video>
          // fullscreen so the user still gets a maximized view instead of a
          // silent failure / unhandled promise rejection.
          enterNativeVideoFullscreen();
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
          webkitVideo.webkitExitFullscreen?.();
        }
      }
    } catch {
      // Exiting fullscreen can also reject; the actual state is re-synced from
      // the browser in the `finally` block below, so swallow and recover.
    } finally {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setShowControls(true);
    }
  }, [isFullscreen, containerRef, videoRef, setIsFullscreen, setShowControls]);

  const togglePictureInPicture = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoElement.requestPictureInPicture();
    }
    setShowSettings(false);
    setShowControls(true);
  }, [videoRef, setShowSettings, setShowControls]);

  const changePlaybackRate = useCallback(
    (rate: number) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;
      videoElement.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
      setShowControls(true);
    },
    [videoRef, setPlaybackRate, setShowSettings, setShowControls],
  );

  const skip = useCallback(
    (seconds: number) => {
      if (seekControlsLocked && seconds > 0) {
        setShowControls(true);
        return;
      }
      const videoElement = videoRef.current;
      if (!videoElement) return;

      videoElement.currentTime = clampPlaybackTime(
        videoElement.currentTime,
        duration,
        seconds,
      );
      setCurrentTime(videoElement.currentTime);
      setShowControls(true);
    },
    [seekControlsLocked, duration, videoRef, setCurrentTime, setShowControls],
  );

  return {
    togglePlay,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    changePlaybackRate,
    skip,
  };
}
