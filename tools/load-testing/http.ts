import type { LoadProfileName, QaUser, RequestMetric } from './types';

interface RequestOptions {
  runId: string;
  profile: LoadProfileName | 'manual';
  flow: string;
  name: string;
  method?: string;
  baseUrl: string;
  path: string;
  user?: QaUser;
  body?: unknown;
  timeoutMs: number;
  headers?: Record<string, string>;
  captureResponseText?: boolean;
}

function userIp(user?: QaUser) {
  if (!user) return undefined;
  const third = Math.floor(user.index / 250);
  const fourth = (user.index % 250) + 1;
  return `10.240.${third}.${fourth}`;
}

export async function timedFetch(options: RequestOptions): Promise<RequestMetric> {
  const method = options.method || (options.body ? 'POST' : 'GET');
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  const url = new URL(options.path, options.baseUrl).toString();

  const headers: Record<string, string> = {
    Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
    'User-Agent': options.user
      ? `SofLIA-LoadTest/${options.runId} vu-${options.user.index}`
      : `SofLIA-LoadTest/${options.runId}`,
    ...options.headers,
  };

  const ip = userIp(options.user);
  if (ip) {
    headers['X-Forwarded-For'] = ip;
    headers['X-Real-IP'] = ip;
  }

  if (options.user) {
    headers.Cookie = `aprende-y-aplica-session=${options.user.sessionToken}`;
  }

  let status = 0;
  let bytes = 0;
  let errorMessage: string | undefined;
  let responseText: string | undefined;

  try {
    const response = await fetch(url, {
      method,
      headers: options.body
        ? {
            ...headers,
            'Content-Type': 'application/json',
          }
        : headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    status = response.status;
    const text = await response.text();
    bytes = Buffer.byteLength(text);
    if (options.captureResponseText) {
      responseText = text.slice(0, 2000);
    }

    if (!response.ok) {
      errorMessage = text.slice(0, 500);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    clearTimeout(timeout);
  }

  const ended = Date.now();

  return {
    runId: options.runId,
    profile: options.profile,
    flow: options.flow,
    name: options.name,
    method,
    url,
    status,
    ok: status >= 200 && status < 400,
    durationMs: ended - started,
    bytes,
    startedAt,
    endedAt: new Date(ended).toISOString(),
    userIndex: options.user?.index,
    error: errorMessage,
    responseText,
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
