export type LoadProfileName = 'smoke' | 'load' | 'stress' | 'spike' | 'soak';

export interface LoadTestConfig {
  baseUrl: string;
  runId: string;
  targetVus: number;
  seedUsers: number;
  aiRatio: number;
  orgSlug: string;
  resultDir: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  netlifySiteId?: string;
  netlifyToken?: string;
  dbMetricsRpc?: string;
  allowProduction: boolean;
  confirmStaging: boolean;
  productionHosts: string[];
  requestTimeoutMs: number;
  thinkTimeMs: number;
  allowUserReuse: boolean;
}

export interface LoadStage {
  name: string;
  durationSec: number;
  targetVus: number;
}

export interface LoadProfile {
  name: LoadProfileName;
  maxVus: number;
  stages: LoadStage[];
}

export interface QaUser {
  index: number;
  userId: string;
  username: string;
  email: string;
  sessionToken: string;
  orgId: string;
  orgSlug: string;
  courseId?: string;
  courseSlug?: string;
  moduleId?: string;
  lessonId?: string;
  planId?: string;
  sessionId?: string;
  trackingId?: string;
}

export interface SeedManifest {
  runId: string;
  createdAt: string;
  prefix: string;
  orgId: string;
  orgSlug: string;
  courseId?: string;
  courseSlug?: string;
  moduleId?: string;
  lessonId?: string;
  users: QaUser[];
  warnings: string[];
  instructorId?: string;
}

export interface RequestMetric {
  runId: string;
  profile: LoadProfileName | 'manual';
  flow: string;
  name: string;
  method: string;
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  bytes: number;
  startedAt: string;
  endedAt: string;
  userIndex?: number;
  error?: string;
  responseText?: string;
}

export interface MetricsSnapshot {
  runId: string;
  label: string;
  capturedAt: string;
  app?: unknown;
  supabase?: unknown;
  netlify?: unknown;
  warnings: string[];
}

export interface RunSummary {
  runId: string;
  profile: LoadProfileName;
  startedAt: string;
  endedAt: string;
  baseUrl: string;
  stages: LoadStage[];
  maxVus: number;
  aiRatio: number;
  aborted: boolean;
  abortReason?: string;
  metricsFile: string;
  snapshotsFile: string;
}

export interface EndpointStats {
  flow: string;
  name: string;
  method: string;
  url: string;
  count: number;
  ok: number;
  failed: number;
  status4xx: number;
  status401: number;
  status5xx: number;
  status429: number;
  timeouts: number;
  bytes: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}
