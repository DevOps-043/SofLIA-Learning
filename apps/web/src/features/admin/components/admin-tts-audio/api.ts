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

const BACKFILL_PAGE_LIMIT = 50;
const MAX_BACKFILL_PAGES = 500;

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
  let offset = 0;
  let page = 0;
  let hasMore = false;
  const aggregate: BackfillResponse = {
    details: [],
    hasMore: false,
    limit: BACKFILL_PAGE_LIMIT,
    nextOffset: 0,
    offset: 0,
    pages: 0,
    queued: 0,
    scanned: 0,
  };

  do {
    const response = await fetch('/api/admin/tts/reading-audio/backfill', {
      body: JSON.stringify({
        allPages: false,
        language: params.language,
        limit: BACKFILL_PAGE_LIMIT,
        offset,
        resource: params.resource,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const result = await readJson<BackfillResponse>(response);

    aggregate.details.push(...result.details);
    aggregate.queued += result.queued;
    aggregate.scanned += result.scanned;
    aggregate.nextOffset = result.nextOffset;
    aggregate.pages = page + 1;
    hasMore = result.hasMore;
    offset = result.nextOffset ?? offset + BACKFILL_PAGE_LIMIT;
    page += 1;
  } while (hasMore && page < MAX_BACKFILL_PAGES);

  aggregate.hasMore = hasMore;
  return aggregate;
}

export async function drainReadingAudioQueue(): Promise<DrainResponse> {
  const response = await fetch('/api/admin/tts/reading-audio/drain', {
    body: JSON.stringify({ limit: 1 }),
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
