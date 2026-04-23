export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseJsonPayload<T>(rawPayload: string): T {
  try {
    return JSON.parse(rawPayload) as T;
  } catch {
    const normalizedPayload = rawPayload.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    return JSON.parse(normalizedPayload) as T;
  }
}
