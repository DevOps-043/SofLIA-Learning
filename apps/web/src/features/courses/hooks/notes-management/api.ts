const NOTE_DELETE_TIMEOUT_MS = 20000;

export function getErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const error = "error" in data ? data.error : undefined;
  const message = "message" in data ? data.message : undefined;

  if (typeof error === "string" && error.trim()) return error;
  if (typeof message === "string" && message.trim()) return message;

  return fallback;
}

export async function readResponseError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as unknown;
    return getErrorMessage(data, fallback);
  } catch {
    return fallback;
  }
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? error.name : undefined;
  return typeof name === "string" && name === "AbortError";
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = NOTE_DELETE_TIMEOUT_MS
): Promise<Response> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => abortController.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: abortController.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}
