export interface AppState {
  activeModals: string[];
  apiCalls: ApiCall[];
  currentPage: string;
  currentUser?: {
    id: string;
    organizationId?: string;
    role: string;
  };
  formStates: Record<string, unknown>;
}

export interface ApiCall {
  endpoint: string;
  method: string;
  status?: number;
  timestamp: Date;
}
