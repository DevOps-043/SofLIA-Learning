export function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

export function normalizeUnknownError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Error desconocido');
}
