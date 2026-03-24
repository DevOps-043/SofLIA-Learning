'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface TourRestartContextType {
  /** Función para reiniciar el tour activo en la página actual, o null si no hay tour */
  restartFn: (() => void) | null;
  /** Etiqueta descriptiva del tour activo (ej: "Tutorial del Dashboard") */
  tourLabel: string | null;
  /** Las páginas con tour llaman a esto para registrar su función de reinicio */
  setRestart: (fn: (() => void) | null, label?: string) => void;
}

const TourRestartContext = createContext<TourRestartContextType | undefined>(undefined);

export function TourRestartProvider({ children }: { children: ReactNode }) {
  const [restartFn, setRestartFn] = useState<(() => void) | null>(null);
  const [tourLabel, setTourLabel] = useState<string | null>(null);

  // useRef para evitar que setRestart cambie de referencia en cada render,
  // lo que causaría loops en los useEffect de los hooks de tour.
  const setRestart = useCallback((fn: (() => void) | null, label?: string) => {
    setRestartFn(() => fn);
    setTourLabel(fn ? (label ?? 'Tour') : null);
  }, []);

  return (
    <TourRestartContext.Provider value={{ restartFn, tourLabel, setRestart }}>
      {children}
    </TourRestartContext.Provider>
  );
}

export function useTourRestart() {
  const context = useContext(TourRestartContext);
  if (context === undefined) {
    throw new Error('useTourRestart must be used within a TourRestartProvider');
  }
  return context;
}
