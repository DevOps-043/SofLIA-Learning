import type { ApiCall } from './app-state.types';

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

export interface ContextRequest extends ContextBuildOptions {}

export interface BuiltContext {
  basePrompt: string;
  fragments: ContextFragment[];
  metadata: {
    buildTime: number;
    cacheHits: number;
    cacheMisses: number;
    providersUsed: string[];
  };
  totalTokens: number;
}

export interface EnrichedMetadata {
  activeComponents?: ActiveComponent[];
  activeModals?: string[];
  apiCalls?: ApiCall[];
  connection?: string;
  contextMarkers?: string[];
  courseContext?: Partial<CourseContextMetadata>;
  errors?: ConsoleError[];
  errorSummary?: string;
  formStates?: Record<string, unknown>;
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

export interface CourseContextMetadata {
  courseId?: string;
  courseSlug?: string;
  courseName?: string;
  lessonId?: string;
  lessonTitle?: string;
  moduleId?: string;
  moduleName?: string;
  progress?: number;
  transcript?: string;
  summary?: string;
}
