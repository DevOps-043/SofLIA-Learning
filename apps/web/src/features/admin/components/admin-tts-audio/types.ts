export type ReadingAudioJobStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ReadingAudioLanguage = 'es' | 'en' | 'pt';
export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'material_reading'
  | 'lesson_transcript'
  | 'lesson_summary';
export type ReadingAudioResource = 'all' | 'activities' | 'lessons' | 'materials';

export interface ReadingAudioJob {
  content_hash: string;
  created_at: string;
  effective_status: ReadingAudioJobStatus;
  error_message: string | null;
  id: string;
  language: ReadingAudioLanguage;
  last_error_code: string | null;
  locked_by: string | null;
  locked_until: string | null;
  model: string;
  next_retry_at: string | null;
  prompt_version: number;
  retry_count: number;
  segment_count: number;
  source_id: string;
  source_text: string;
  source_type: ReadingAudioSourceType;
  status: ReadingAudioJobStatus;
  updated_at: string;
  voice: string;
}

export interface JobsApiResponse {
  jobs: ReadingAudioJob[];
  pagination: {
    limit: number;
    offset: number;
  };
  summary: Record<ReadingAudioJobStatus, number>;
  total: number;
}

export interface BackfillResponse {
  details: Array<{
    language: ReadingAudioLanguage;
    queued: number;
    resource: Exclude<ReadingAudioResource, 'all'>;
    scanned: number;
  }>;
  hasMore: boolean;
  limit: number;
  nextOffset?: number;
  offset: number;
  pages?: number;
  queued: number;
  scanned: number;
}

export interface DrainResponse {
  deferred?: number;
  details?: Array<{
    jobId: string;
    status: ReadingAudioJobStatus | 'deferred' | 'skipped';
  }>;
  failed?: number;
  prepared?: number;
  processed: number;
  quotaLimit?: number;
  quotaReached?: boolean;
  quotaRemaining?: number;
  results?: Array<{
    jobId: string;
    status: ReadingAudioJobStatus | 'deferred' | 'skipped';
  }>;
  scannedForPreparation?: number;
  skipped?: number;
  workerId?: string;
}

export interface ReprocessResponse {
  jobId?: string;
  requeued?: number;
  retryFailed?: boolean;
  status?: ReadingAudioJobStatus;
}

export interface CleanupResponse {
  deletedAssets: number;
  deletedJobs: number;
  deletedProgress: number;
  deletedStorageObjects: number;
  scanned: number;
  success: boolean;
}

export interface DiagnosticsResponse {
  bucketReady: boolean;
  cronSecretReady: boolean;
  providerReady: boolean;
  summary: {
    healthy: boolean;
    problems: string[];
  };
  totals: Record<ReadingAudioJobStatus, number>;
}
