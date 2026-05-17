'use client';

import { LiaContext } from './lia-context.context';
import { useLiaContextValue } from './useLiaContextValue';
import type { LiaContextProviderProps } from './lia-context.types';

export { useLiaContext, useLiaContextSafe } from './lia-context.context';
export type { LiaEnrichedMetadata } from './lia-context.types';

export function LiaContextProvider({
  children,
  captureErrors = true,
  detectComponents = true,
  trackApiCalls = true,
}: LiaContextProviderProps) {
  const value = useLiaContextValue({
    captureErrors,
    detectComponents,
    trackApiCalls,
  });

  return <LiaContext.Provider value={value}>{children}</LiaContext.Provider>;
}

export default LiaContextProvider;
