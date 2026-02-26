export type ComplianceState = 'completed' | 'waived' | 'overdue' | 'due_soon' | 'on_track';

export interface PolicyVersion {
  id: string;
  policyId: string;
  organizationId: string;
  version: number;
  rules: PolicyRules;
}

export interface PolicyRules {
  defaultGracePeriodDays: number;
  dueSoonThresholdDays: number;
  allowCalendarSync: boolean;
  policyApplicationMode?: 'frozen_on_assignment' | 'dynamic_recalculation' | 'recalculation_with_audit';
}

export interface LearningObligation {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string;
  startDate: string;
  hardDueDate: string;
  softDueDate?: string | null;
  gracePeriodDays: number;
  complianceMode?: 'strict' | 'flexible';
  status: 'active' | 'completed' | 'exempted';
  completedAt?: string | null;
  exemptedAt?: string | null;
}

export interface EvaluatedObligation extends LearningObligation {
  complianceState: ComplianceState;
  daysUntilDue: number | null;
}

export interface GeneratePlanRequest {
  organizationId: string;
  userId: string;
  obligations: LearningObligation[];
  policyVersion: PolicyVersion;
}
