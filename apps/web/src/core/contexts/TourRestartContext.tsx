'use client';

import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

interface TourRestartContextType {
  /** Funcion para reiniciar el tour activo en la pagina actual, o null si no hay tour */
  restartFn: (() => void) | null;
  /** Etiqueta descriptiva del tour activo */
  tourLabel: string | null;
  /** Las paginas con tour llaman a esto para registrar su funcion de reinicio */
  setRestart: (fn: (() => void) | null, label?: string) => void;
}

const TourRestartContext = createContext<TourRestartContextType | undefined>(undefined);

export function TourRestartProvider({ children }: { children: ReactNode }) {
  const [restartFn, setRestartFn] = useState<(() => void) | null>(null);
  const [tourLabel, setTourLabel] = useState<string | null>(null);
  const restartFnRef = useRef<(() => void) | null>(null);
  const tourLabelRef = useRef<string | null>(null);

  const setRestart = useCallback((fn: (() => void) | null, label?: string) => {
    const nextLabel = fn ? (label ?? 'Tour') : null;
    if (restartFnRef.current === fn && tourLabelRef.current === nextLabel) {
      return;
    }

    restartFnRef.current = fn;
    tourLabelRef.current = nextLabel;
    setRestartFn(() => fn);
    setTourLabel(nextLabel);
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
