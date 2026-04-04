import type { Json } from '@/lib/supabase/types'

export type SCORMVersion = 'SCORM_1.2' | 'SCORM_2004';

export interface ScormPackage {
  id: string;
  organization_id: string;
  course_id: string;
  title: string;
  description?: string;
  version: SCORMVersion;
  manifest_data: Json;
  entry_point: string;
  storage_path: string;
  file_size: number;
  status: 'active' | 'inactive' | 'processing';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScormAttempt {
  id: string;
  user_id: string;
  package_id: string;
  attempt_number: number;
  lesson_status: string;
  lesson_location?: string;
  credit?: string;
  entry?: string;
  exit_type?: string;
  score_raw?: number;
  score_min?: number;
  score_max?: number;
  score_scaled?: number;
  suspend_data?: string;
  total_time?: string;
  session_time?: string;
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
}

export interface ScormInteraction {
  id: string;
  attempt_id: string;
  interaction_id: string;
  interaction_type?: string;
  description?: string;
  learner_response?: string;
  correct_response?: string;
  result?: string;
  weighting?: number;
  latency?: string;
  timestamp: string;
}

export interface ScormObjective {
  id: string;
  attempt_id: string;
  objective_id: string;
  score_raw?: number;
  score_min?: number;
  score_max?: number;
  score_scaled?: number;
  success_status?: string;
  completion_status?: string;
  description?: string;
}

export interface SCORMAdapterConfig {
  packageId: string;
  version: SCORMVersion;
  onError?: (error: string) => void;
  onComplete?: (status: string, score?: number) => void;
}

export interface SCORMPlayerProps {
  packageId: string;
  version: SCORMVersion;
  storagePath: string;
  entryPoint: string;
  onComplete?: (status: string, score?: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface SCORMUploaderProps {
  courseId: string;
  organizationId: string;
  onSuccess?: (packageData: ScormPackage) => void;
  onError?: (error: string) => void;
}

// CMI Data types
export interface CMIData {
  [key: string]: string;
}

// API Response types
export interface ScormUploadResponse {
  success: boolean;
  package?: ScormPackage;
  error?: string;
}

export interface ScormInitializeResponse {
  success: boolean;
  attemptId?: string;
  cmiData?: CMIData;
  error?: string;
}

export interface ScormRuntimeResponse {
  success: boolean;
  error?: string;
}

export interface ScormPackagesResponse {
  packages: ScormPackage[];
  error?: string;
}
