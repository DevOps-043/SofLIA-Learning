'use client';

import { createContext, useContext } from 'react';
import type { LiaContextValue } from './lia-context.types';

export const LiaContext = createContext<LiaContextValue | null>(null);

export function useLiaContext() {
  const context = useContext(LiaContext);

  if (!context) {
    throw new Error('useLiaContext must be used within a LiaContextProvider');
  }

  return context;
}

export function useLiaContextSafe() {
  return useContext(LiaContext);
}
