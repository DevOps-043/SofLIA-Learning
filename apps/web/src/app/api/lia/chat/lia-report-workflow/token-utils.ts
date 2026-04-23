import { BUG_REPORT_DRAFT_REGEX, BUG_REPORT_REGEX } from './constants';
import {
  BugReportDraftTokenPayload,
  ExtractedToken,
} from './types';
import { parseJsonPayload } from './value-readers';

export function extractToken<T>(
  content: string,
  regex: RegExp
): ExtractedToken<T> | null {
  const match = content.match(regex);
  if (!match?.[1]) return null;
  return { payload: parseJsonPayload<T>(match[1]), token: match[0] };
}

export function stripTokenMarkers(content: string): string {
  return content
    .replace(BUG_REPORT_DRAFT_REGEX, '')
    .replace(BUG_REPORT_REGEX, '')
    .trim();
}

export function serializeDraftToken(
  payload: BugReportDraftTokenPayload
): string {
  return `[[BUG_REPORT_DRAFT:${JSON.stringify(payload)}]]`;
}

export function extractBugReportDraftToken(
  content: string
): BugReportDraftTokenPayload | null {
  try {
    return extractToken<BugReportDraftTokenPayload>(content, BUG_REPORT_DRAFT_REGEX)?.payload ?? null;
  } catch (error) {
    console.error('Error leyendo el borrador de reporte de SofLIA:', error);
    return null;
  }
}

export function stripBugReportTokens(content: string): string {
  return stripTokenMarkers(content);
}
