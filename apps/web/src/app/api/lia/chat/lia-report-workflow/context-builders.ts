import type {
  ReportProblemCourseContext,
  ReportProblemOriginContext,
} from '@/core/reporting/report-problem.contract';
import type { ChatRequest } from '../platform-context.service';
import { LiaChatProcessingBody } from './types';
import { asRecord, readNumber, readString } from './value-readers';

export function buildCourseContext(
  requestContext: ChatRequest['context']
): ReportProblemCourseContext | null {
  const lessonContext = requestContext?.currentLessonContext;
  if (!lessonContext) return null;

  return {
    contextType: lessonContext.contextType,
    courseId: lessonContext.courseId,
    courseSlug: lessonContext.courseSlug,
    courseTitle: lessonContext.courseTitle,
    moduleId: lessonContext.moduleId,
    moduleTitle: lessonContext.moduleTitle,
    lessonId: lessonContext.lessonId,
    lessonTitle: lessonContext.lessonTitle,
    currentTab: lessonContext.currentTab || requestContext?.currentTab,
    currentPage: lessonContext.currentPage || requestContext?.currentPage,
  };
}

export function buildOriginContext(
  requestContext: ChatRequest['context']
): ReportProblemOriginContext {
  return {
    paginaUrl: requestContext?.currentPage || null,
    pathname: requestContext?.currentPage || null,
    currentPage: requestContext?.currentPage || null,
    currentTab: requestContext?.currentTab || null,
    pageType: requestContext?.pageType ? String(requestContext.pageType) : null,
  };
}

export function buildScreenResolution(
  enrichedMetadata: Record<string, unknown> | undefined
): string | null {
  const metadataRecord = enrichedMetadata ? asRecord(enrichedMetadata) : null;
  const viewport = metadataRecord ? asRecord(metadataRecord.viewport) : null;
  const width = readNumber(viewport?.width);
  const height = readNumber(viewport?.height);
  return width && height ? `${width}x${height}` : null;
}

export function buildLiaDiagnostics(
  body: LiaChatProcessingBody,
  originalUserMessage: string,
  recordingUrl: string | null
): Record<string, unknown> {
  const metadataRecord = body.enrichedMetadata ? asRecord(body.enrichedMetadata) : null;
  const errors = metadataRecord?.errors;
  const contextMarkers = metadataRecord?.contextMarkers;

  return {
    chatMessageContent: originalUserMessage,
    aiGeneratedTitle: null,
    clientViewport: metadataRecord?.viewport,
    clientPlatform: metadataRecord?.platform,
    clientLanguage: metadataRecord?.language,
    clientTimezone: metadataRecord?.timezone,
    clientConnection: metadataRecord?.connection,
    clientMemory: metadataRecord?.memory,
    sessionDurationMs: metadataRecord?.sessionDuration,
    recentErrors: Array.isArray(errors) ? errors.slice(-5) : [],
    errorSummary: metadataRecord?.errorSummary,
    contextMarkers: Array.isArray(contextMarkers) ? contextMarkers.slice(-10) : [],
    sessionSummary: metadataRecord?.sessionSummary,
    recordingInfo: metadataRecord?.recordingInfo,
    isCompressed: body.sessionSnapshot?.startsWith('gzip:') || false,
    detectedAsBug: body.isBugReport || false,
    recordingUrl,
  };
}
