function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getUnknownErrorName(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;
  return typeof error.name === "string" ? error.name : undefined;
}

export function getUnknownErrorMessage(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;
  return typeof error.message === "string" ? error.message : undefined;
}

export function isAbortLikeError(error: unknown, signal?: AbortSignal) {
  return getUnknownErrorName(error) === "AbortError" || Boolean(signal?.aborted);
}

export function isIgnoredNetworkError(error: unknown) {
  const message = getUnknownErrorMessage(error) ?? "";
  return message.includes("Failed to fetch") || message.includes("NetworkError");
}
