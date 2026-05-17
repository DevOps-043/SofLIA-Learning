export function scrollToTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function isAbortError(error: unknown) {
  return (error as { name?: string })?.name === "AbortError";
}
