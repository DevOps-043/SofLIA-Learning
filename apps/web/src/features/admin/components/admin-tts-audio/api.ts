import type {
  BackfillResponse,
  CleanupResponse,
  DiagnosticsResponse,
  DrainResponse,
  JobsApiResponse,
  ReadingAudioJobStatus,
  ReadingAudioLanguage,
  ReadingAudioResource,
  ReadingAudioSourceType,
  ReprocessResponse,
} from './types';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error?: unknown }).error)
      : `HTTP ${response.status}`;
    throw new Error(error);
  }
  return payload as T;
}

export async function fetchDiagnostics(): Promise<DiagnosticsResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/diagnostics', {
    credentials: 'include',
  });
  return readJson<DiagnosticsResponse>(response);
}

export async function fetchReadingAudioJobs(params: {
  language: ReadingAudioLanguage | 'all';
  sourceType: ReadingAudioSourceType | 'all';
  status: ReadingAudioJobStatus | 'all';
}): Promise<JobsApiResponse> {
  const searchParams = new URLSearchParams({
    language: params.language,
    limit: '100',
    offset: '0',
    sourceType: params.sourceType,
    status: params.status,
  });
  const response = await fetch(`/api/admin/tts/reading-audio/jobs?${searchParams}`, {
    credentials: 'include',
  });
  return readJson<JobsApiResponse>(response);
}

export async function backfillReadingAudio(params: {
  language: ReadingAudioLanguage | 'all';
  resource: ReadingAudioResource;
}): Promise<BackfillResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/backfill', {
    body: JSON.stringify({
      allPages: true,
      language: params.language,
      limit: 100,
      offset: 0,
      resource: params.resource,
    }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return readJson<BackfillResponse>(response);
}

export async function drainReadingAudioQueue(): Promise<DrainResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/drain', {
    body: JSON.stringify({ limit: 10 }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return readJson<DrainResponse>(response);
}

export async function cleanupNonTargetReadingAudioJobs(): Promise<CleanupResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/cleanup', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return readJson<CleanupResponse>(response);
}

export async function retryFailedReadingAudioJobs(): Promise<ReprocessResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/reprocess', {
    body: JSON.stringify({ limit: 100, retryFailed: true }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return readJson<ReprocessResponse>(response);
}

export async function reprocessReadingAudioJob(jobId: string): Promise<ReprocessResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/reprocess', {
    body: JSON.stringify({ jobId }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  return readJson<ReprocessResponse>(response);
}
