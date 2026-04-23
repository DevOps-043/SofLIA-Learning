import type { RefObject } from 'react';
import { clampPlaybackTime } from './video-player.utils';

interface PlaybackActionsParams {
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  setCurrentTime: (value: number) => void;
  setIsMuted: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackRate: (value: number) => void;
  setShowControls: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
  volume: number;
}

export function useCustomVideoPlayerPlaybackActions({
  duration,
  isMuted,
  isPlaying,
  setCurrentTime,
  setIsMuted,
  setIsPlaying,
  setPlaybackRate,
  setShowControls,
  setShowSettings,
  videoRef,
  volume,
}: PlaybackActionsParams) {
  const togglePlay = async () => {
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
    } catch (error) {
      // Most common causes: browser autoplay policy blocked, or network interruption.
      // We intentionally fall back to paused state rather than rethrowing.
      console.warn('[VideoPlayer] play() failed — falling back to paused state', error)
      setIsPlaying(false);
    }

    setShowControls(true);
  };

  const toggleMute = () => {
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
  };

  const togglePictureInPicture = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!document.pictureInPictureEnabled) {
      console.warn('[VideoPlayer] Picture-in-Picture is not supported in this browser')
      return
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoElement.requestPictureInPicture()
      }
    } catch (error) {
      // PiP can be rejected by browser permissions, low power mode, or unsupported codec.
      console.warn('[VideoPlayer] Picture-in-Picture toggle failed', error)
    }

    setShowSettings(false);
    setShowControls(true);
  };

  const changePlaybackRate = (rate: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setShowControls(true);
  };

  const skip = (seconds: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = clampPlaybackTime(videoElement.currentTime, duration, seconds);
    setCurrentTime(videoElement.currentTime);
    setShowControls(true);
  };

  return { changePlaybackRate, skip, toggleMute, togglePictureInPicture, togglePlay };
}
