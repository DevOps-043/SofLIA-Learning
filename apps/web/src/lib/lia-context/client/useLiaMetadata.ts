'use client';

import { useCallback, useMemo } from 'react';
import type { useActiveComponents } from '../hooks/useActiveComponents';
import type { useApiTracking } from '../hooks/useApiTracking';
import type { useErrorCapture } from '../hooks/useErrorCapture';
import type { LiaEnrichedMetadata } from './lia-context.types';

type ErrorCapture = ReturnType<typeof useErrorCapture>;
type ComponentDetection = ReturnType<typeof useActiveComponents>;
type ApiTracking = ReturnType<typeof useApiTracking>;

interface UseLiaMetadataOptions {
  apiTracking: ApiTracking;
  componentDetection: ComponentDetection;
  contextMarkers: string[];
  currentPage: string;
  errorCapture: ErrorCapture;
  platformInfo: LiaEnrichedMetadata['platform'];
  sessionStart: number;
}

export function useLiaMetadata(options: UseLiaMetadataOptions) {
  const getMetadataForApi = useCallback((): LiaEnrichedMetadata => {
    const errors = options.errorCapture.getErrorsForLia();
    const summary = options.errorCapture.getErrorSummary();

    return {
      activeComponents: options.componentDetection.getComponentsForLia(),
      apiCalls: options.apiTracking.getCallsForLia(),
      contextMarkers: options.contextMarkers,
      currentPage: options.currentPage,
      errors: errors.map(error => ({
        message: error.message,
        stack: error.stack,
        timestamp: error.timestamp,
        type: error.type,
      })),
      errorSummary: summary
        ? `${summary.total} errores (${summary.byType.console} consola, ${summary.byType.exception} excepciones, ${summary.byType.promise} promesas)`
        : 'Sin errores',
      platform: options.platformInfo,
      sessionDuration: Date.now() - options.sessionStart,
      viewport:
        typeof window !== 'undefined'
          ? { height: window.innerHeight, width: window.innerWidth }
          : { height: 0, width: 0 },
    };
  }, [options]);

  const metadata = useMemo(() => getMetadataForApi(), [getMetadataForApi]);

  return { getMetadataForApi, metadata };
}
