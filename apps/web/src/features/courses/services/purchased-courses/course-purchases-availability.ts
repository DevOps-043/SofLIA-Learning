const OPTIONAL_TABLE_RECHECK_MS = 5 * 60 * 1000;

let coursePurchasesUnavailableUntil = 0;

export function shouldSkipCoursePurchasesTable(): boolean {
  return Date.now() < coursePurchasesUnavailableUntil;
}

export function markCoursePurchasesUnavailable(): void {
  coursePurchasesUnavailableUntil = Date.now() + OPTIONAL_TABLE_RECHECK_MS;
}

export function isMissingCoursePurchasesError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const record = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = [record.code, record.message, record.details]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    text.includes("course_purchases") &&
    (
      text.includes("schema cache") ||
      text.includes("could not find") ||
      text.includes("does not exist") ||
      text.includes("42p01") ||
      text.includes("pgrst205")
    )
  );
}
