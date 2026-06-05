export interface LiaChatStreamEvent {
  content?: string;
  done?: boolean;
}

export interface LiaChatStreamParseResult {
  events: LiaChatStreamEvent[];
  remainingBuffer: string;
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

  while (true) {
    const eventEnd = normalizedBuffer.indexOf('\n\n');
    if (eventEnd === -1) {
      break;
    }

    const block = normalizedBuffer.slice(0, eventEnd);
    normalizedBuffer = normalizedBuffer.slice(eventEnd + 2);

    const event = parseEventBlock(block);
    if (event) {
      events.push(event);
    }
  }

  return {
    events,
    remainingBuffer: normalizedBuffer,
  };
}
