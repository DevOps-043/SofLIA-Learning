export type NormalizedLiaLink =
  | { kind: "external"; url: string }
  | { kind: "internal"; url: string };

const BLOCKED_URL_SCHEMES = new Set([
  "data:",
  "file:",
  "javascript:",
  "vbscript:",
]);

export function normalizeLiaLinkUrl(rawUrl: string): NormalizedLiaLink | null {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl || /[\u0000-\u001F\u007F]/.test(trimmedUrl)) {
    return null;
  }

  const lowerUrl = trimmedUrl.toLowerCase();

  for (const blockedScheme of BLOCKED_URL_SCHEMES) {
    if (lowerUrl.startsWith(blockedScheme)) {
      return null;
    }
  }

  if (trimmedUrl.startsWith("/")) {
    if (trimmedUrl.startsWith("//")) {
      return null;
    }

    return {
      kind: "internal",
      url: trimmedUrl,
    };
  }

  const withProtocol = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : /^www\.[^\s/$.?#].[^\s]*$/i.test(trimmedUrl)
      ? `https://${trimmedUrl}`
      : trimmedUrl;

  try {
    const parsedUrl = new URL(withProtocol);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return {
      kind: "external",
      url: parsedUrl.toString(),
    };
  } catch {
    return null;
  }
}
