export interface ContextFragment {
  content: string;
  priority: number;
  tokens: number;
  type: string;
}

export interface ContextBuildOptions {
  contextType: string;
  currentPage?: string;
  enrichedMetadata?: EnrichedMetadata;
  isBugReport?: boolean;
  userId?: string;
}

export interface EnrichedMetadata {
  activeComponents?: ActiveComponent[];
  connection?: string;
  contextMarkers?: string[];
  errors?: ConsoleError[];
  errorSummary?: string;
  language?: string;
  memory?: number;
  platform?: {
    browser?: string;
    os?: string;
    version?: string;
  };
  recordingInfo?: {
    events?: number;
    size?: number;
  };
  sessionDuration?: number;
  sessionSummary?: string;
  timezone?: string;
  viewport?: {
    height: number;
    width: number;
  };
}

export interface ConsoleError {
  message: string;
  stack?: string;
  timestamp?: Date;
  type: 'error' | 'warn' | 'log';
}

export interface ActiveComponent {
  name: string;
  props?: Record<string, unknown>;
  selector: string;
  state?: Record<string, unknown>;
}
