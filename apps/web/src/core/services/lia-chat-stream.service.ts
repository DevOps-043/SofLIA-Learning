export interface LiaChatStreamEvent {
  content?: string;
  done?: boolean;
  navigateTo?: string;
  downloads?: LiaDownloadRequest[];
}

export interface LiaDownloadRequest {
  url: string;
  method: 'POST';
  body: Record<string, string | number | boolean>;
}

export interface LiaChatStreamParseResult {
  events: LiaChatStreamEvent[];
  remainingBuffer: string;
}

export function isSafeLiaNavigationTarget(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.includes('\\') ||
    value.startsWith('//')
  ) {
    return false;
  }

  const target = new URL(value, 'https://soflia.internal');
  const path = target.pathname;
  const queryKeys = [...target.searchParams.keys()];

  if (path === '/admin') return queryKeys.length === 0;
  if (path === '/admin/users') {
    const tab = target.searchParams.get('panelTab');
    return (
      queryKeys.every((key) => key === 'panelUser' || key === 'panelTab') &&
      (!tab || ['profile', 'account', 'organizations', 'courses', 'learningPaths', 'stats', 'audit'].includes(tab))
    );
  }
  if (/^\/admin\/companies\/[^/]+$/.test(path)) return queryKeys.length === 0;
  if (/^\/admin\/companies\/[^/]+\/edit$/.test(path)) {
    const tab = target.searchParams.get('tab');
    return (
      queryKeys.every((key) => key === 'tab') &&
      (!tab || ['general', 'users', 'courses', 'stats', 'customization'].includes(tab))
    );
  }

  const businessMatch = path.match(/^\/[^/]+\/business-panel\/(.+)$/);
  if (!businessMatch) return false;
  const section = businessMatch[1];

  if (section === 'users') {
    const tab = target.searchParams.get('tab');
    const panel = target.searchParams.get('panel');
    return (
      queryKeys.every((key) => ['tab', 'panelUser', 'panel', 'search'].includes(key)) &&
      (!tab || ['users', 'invitations', 'links', 'requests'].includes(tab)) &&
      (!panel || ['stats', 'edit'].includes(panel)) &&
      (!panel || Boolean(target.searchParams.get('panelUser')))
    );
  }
  if (section === 'courses') {
    const tab = target.searchParams.get('tab');
    return queryKeys.every((key) => key === 'tab') && (!tab || ['courses', 'paths'].includes(tab));
  }

  return (
    queryKeys.length === 0 &&
    (
      /^courses\/[^/]+$/.test(section) ||
      section === 'hierarchy' ||
      /^hierarchy\/node\/[^/]+$/.test(section) ||
      section === 'reports'
    )
  );
}

/** Allowlist cerrada de descargas que una acción de SofLIA puede iniciar. */
export function isSafeLiaDownloadRequest(value: unknown): value is LiaDownloadRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<LiaDownloadRequest>;
  if (request.method !== 'POST' || !request.body || typeof request.body !== 'object') {
    return false;
  }

  if (
    typeof request.url !== 'string' ||
    request.url.includes('\\') ||
    !/^\/api\/[^/?#]+\/business\/reports-analytics\/insights$/.test(request.url)
  ) {
    return false;
  }

  return (
    request.body.format === 'pdf' &&
    (request.body.locale === 'es' || request.body.locale === 'en' || request.body.locale === 'pt')
  );
}

function parseDataLine(line: string): string | null {
  if (!line.startsWith('data:')) {
    return null;
  }

  return line.slice(5).trimStart();
}

function parseEventBlock(block: string): LiaChatStreamEvent | null {
  const dataLines = block
    .split('\n')
    .map(parseDataLine)
    .filter((line): line is string => line !== null);

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join('\n').trim();
  if (!payload || payload === '[DONE]') {
    return { done: true };
  }

  try {
    return JSON.parse(payload) as LiaChatStreamEvent;
  } catch {
    return null;
  }
}

/**
 * Consume complete SSE events and keeps the unfinished tail for the next network
 * read. Fetch chunks are not aligned to `data:` boundaries; parsing each raw
 * chunk independently can silently drop partial JSON and truncate SofLIA text.
 */
export function consumeLiaChatStreamBuffer(
  buffer: string,
): LiaChatStreamParseResult {
  let normalizedBuffer = buffer.replace(/\r\n/g, '\n');
  const events: LiaChatStreamEvent[] = [];

  let eventEnd = normalizedBuffer.indexOf('\n\n');
  while (eventEnd !== -1) {
    const block = normalizedBuffer.slice(0, eventEnd);
    normalizedBuffer = normalizedBuffer.slice(eventEnd + 2);

    const event = parseEventBlock(block);
    if (event) {
      events.push(event);
    }
    eventEnd = normalizedBuffer.indexOf('\n\n');
  }

  return {
    events,
    remainingBuffer: normalizedBuffer,
  };
}
