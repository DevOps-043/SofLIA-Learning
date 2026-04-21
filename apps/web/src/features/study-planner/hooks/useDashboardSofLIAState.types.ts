import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  StudyPlannerAction,
  StudyPlannerDashboardState,
} from './useStudyPlannerDashboardSofLIA';

export interface UseDashboardSofLIAStateParams {
  userId: string | undefined;
  getState: () => StudyPlannerDashboardState;
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>;
  loadActivePlan: () => Promise<void>;
}

export interface UseDashboardSofLIAStateReturn {
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: StudyPlannerAction, data: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  dismissCalendarChanges: () => void;
  abortControllerRef: MutableRefObject<AbortController | null>;
}

export interface DashboardChatErrorPayload {
  error?: string;
  response?: string;
}

export interface DashboardChatActionPayload {
  code?: string;
  data?: Record<string, unknown>;
  message?: string;
  status?: 'pending' | 'success' | 'error' | 'confirmation_needed';
  traceId?: string;
  type?: StudyPlannerAction;
}

export interface DashboardChatSuccessPayload {
  action?: DashboardChatActionPayload;
  actions?: DashboardChatActionPayload[];
  response?: string;
  success?: boolean;
  traceId?: string;
}

export interface DashboardChatActionExecutionPayload {
  action?: DashboardChatActionPayload;
  error?: string;
  message?: string;
  success?: boolean;
  traceId?: string;
}
