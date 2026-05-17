'use client';

import { useCallback, useMemo, useState } from 'react';
import { useActiveComponents } from '../hooks/useActiveComponents';
import { useApiTracking } from '../hooks/useApiTracking';
import { useErrorCapture } from '../hooks/useErrorCapture';
import { detectPlatformInfo } from './platform-info';
import { useContextMarkers } from './useContextMarkers';
import { useCurrentPage } from './useCurrentPage';
import { useLiaMetadata } from './useLiaMetadata';
import type {
  LiaContextCaptureOptions,
  LiaContextValue,
} from './lia-context.types';

export function useLiaContextValue({
  captureErrors,
  detectComponents,
  trackApiCalls,
}: LiaContextCaptureOptions): LiaContextValue {
  const errorCapture = useErrorCapture({
    captureConsole: captureErrors,
    captureExceptions: captureErrors,
    capturePromises: captureErrors,
  });
  const componentDetection = useActiveComponents({ observe: detectComponents });
  const apiTracking = useApiTracking({ interceptFetch: trackApiCalls });
  const [sessionStart] = useState(() => Date.now());
  const [platformInfo] = useState(() => detectPlatformInfo());
  const currentPage = useCurrentPage();
  const { addContextMarker, clearContextMarkers, contextMarkers } = useContextMarkers();

  const clearAll = useCallback(() => {
    errorCapture.clearErrors();
    apiTracking.clearCalls();
    clearContextMarkers();
  }, [apiTracking, clearContextMarkers, errorCapture]);

  const { getMetadataForApi, metadata } = useLiaMetadata({
    apiTracking,
    componentDetection,
    contextMarkers,
    currentPage,
    errorCapture,
    platformInfo,
    sessionStart,
  });

  return useMemo(
    () => ({
      addContextMarker,
      apiCalls: apiTracking.apiCalls,
      clearAll,
      clearContextMarkers,
      components: componentDetection.components,
      errorCount: errorCapture.errorCount,
      errors: errorCapture.errors,
      getMetadataForApi,
      hasErrors: errorCapture.hasErrors,
      metadata,
    }),
    [
      addContextMarker,
      apiTracking.apiCalls,
      clearAll,
      clearContextMarkers,
      componentDetection.components,
      errorCapture.errorCount,
      errorCapture.errors,
      errorCapture.hasErrors,
      getMetadataForApi,
      metadata,
    ]
  );
}
