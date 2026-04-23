import { useCallback, useEffect, useRef } from 'react';

interface ControlsTimeoutParams {
  isHovering: boolean;
  isPlaying: boolean;
  setIsHovering: (value: boolean) => void;
  setShowControls: (value: boolean) => void;
}

export function useCustomVideoPlayerControlsTimeout({
  isHovering,
  isPlaying,
  setIsHovering,
  setShowControls,
}: ControlsTimeoutParams) {
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
  }, [setIsHovering, setShowControls]);

  useEffect(() => {
    if (isHovering || isPlaying) {
      resetControlsTimeout();
    }

    if (!isPlaying) {
      setShowControls(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    }
  }, [isHovering, isPlaying, resetControlsTimeout, setShowControls]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return resetControlsTimeout;
}
