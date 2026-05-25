'use client';

import { useCallback, useState } from 'react';

const MAX_CONTEXT_MARKERS = 20;

export function useContextMarkers() {
  const [contextMarkers, setContextMarkers] = useState<string[]>([]);

  const addContextMarker = useCallback((marker: string) => {
    setContextMarkers(prev => {
      const newMarkers = [...prev, `${new Date().toISOString()}: ${marker}`];
      return newMarkers.slice(-MAX_CONTEXT_MARKERS);
    });
  }, []);

  const clearContextMarkers = useCallback(() => {
    setContextMarkers([]);
  }, []);

  return {
    addContextMarker,
    clearContextMarkers,
    contextMarkers,
  };
}
