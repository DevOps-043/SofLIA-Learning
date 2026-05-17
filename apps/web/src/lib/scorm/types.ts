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

export type {
  CMIData,
  SCORMAdapterConfig,
  SCORMPlayerProps,
  SCORMUploaderProps,
  ScormInitializeResponse,
  ScormPackagesResponse,
  ScormRuntimeResponse,
  ScormUploadResponse,
} from './scorm-runtime.types'
