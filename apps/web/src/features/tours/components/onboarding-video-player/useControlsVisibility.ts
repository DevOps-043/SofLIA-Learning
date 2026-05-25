import { useCallback, useEffect, useRef, useState } from 'react';

export function useControlsVisibility(isPlaying: boolean) {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
      return;
    }

    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [isPlaying, resetControlsTimeout]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { resetControlsTimeout, setShowControls, showControls };
}
