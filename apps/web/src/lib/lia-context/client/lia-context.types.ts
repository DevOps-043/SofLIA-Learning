import type React from 'react';
import type { ApiCall } from '../hooks/useApiTracking';
import type { ActiveComponent } from '../hooks/useActiveComponents';
import type { CapturedError } from '../hooks/useErrorCapture';

export interface LiaPlatformInfo {
  browser: string;
  version: string;
  os: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface LiaEnrichedMetadata {
  platform: LiaPlatformInfo;
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: Date;
  }>;
  errorSummary: string;
  activeComponents: Array<{
    name: string;
    selector: string;
    props?: Record<string, unknown>;
    state?: string;
  }>;
  apiCalls: Array<{
    endpoint: string;
    method: string;
    status?: number;
    isError: boolean;
    duration?: number;
    timestamp: string;
  }>;
  viewport: {
    width: number;
    height: number;
  };
  sessionDuration: number;
  contextMarkers: string[];
  currentPage: string;
}

export interface LiaContextValue {
  metadata: LiaEnrichedMetadata;
  errors: CapturedError[];
  components: ActiveComponent[];
  apiCalls: ApiCall[];
  hasErrors: boolean;
  errorCount: number;
  clearAll: () => void;
  getMetadataForApi: () => LiaEnrichedMetadata;
  addContextMarker: (marker: string) => void;
  clearContextMarkers: () => void;
}

export interface LiaContextProviderProps {
  children: React.ReactNode;
  captureErrors?: boolean;
  detectComponents?: boolean;
  trackApiCalls?: boolean;
}

export interface LiaContextCaptureOptions {
  captureErrors: boolean;
  detectComponents: boolean;
  trackApiCalls: boolean;
}
