import { getUnknownErrorMessage, getUnknownErrorName } from "./parsers";

export function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return getUnknownErrorName(error) === "AbortError" || signal?.aborted === true;
}

export function isNetworkError(error: unknown): boolean {
  const errorMessage = getUnknownErrorMessage(error) ?? "";
  return (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError")
  );
}

export function warnInDevelopment(message: string, ...details: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, ...details);
  }
}
