export const REPORT_PROBLEM_CATEGORIES = [
  'bug',
  'sugerencia',
  'contenido',
  'performance',
  'ui-ux',
  'otro',
] as const;

export const REPORT_PROBLEM_PRIORITIES = [
  'baja',
  'media',
  'alta',
  'critica',
] as const;

export const REPORT_PROBLEM_STATUSES = [
  'pendiente',
  'en_revision',
  'en_progreso',
  'resuelto',
  'rechazado',
  'duplicado',
] as const;

export const REPORT_PROBLEM_SOURCES = [
  'manual_modal',
  'lia_chat_automatic',
  'lia_course_chat',
] as const;

export const REPORT_PROBLEM_IRIS_SYNC_STATUSES = [
  'pending',
  'sent',
  'skipped',
] as const;

export const REPORT_PROBLEM_MAX_ATTACHMENTS = 3;
export const REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type ReportProblemCategory =
  (typeof REPORT_PROBLEM_CATEGORIES)[number];

export type ReportProblemPriority =
  (typeof REPORT_PROBLEM_PRIORITIES)[number];

export type ReportProblemStatus =
  (typeof REPORT_PROBLEM_STATUSES)[number];

export type ReportProblemSource =
  (typeof REPORT_PROBLEM_SOURCES)[number];

export type ReportProblemIrisSyncStatus =
  (typeof REPORT_PROBLEM_IRIS_SYNC_STATUSES)[number];

export interface LiaImageAttachment {
  kind: 'image';
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  width?: number | null;
  height?: number | null;
}

export interface UploadedReportAttachment {
  kind: 'image';
  fileName: string;
  mimeType: string;
  size: number;
  publicUrl: string | null;
  storagePath: string;
  width?: number | null;
  height?: number | null;
}

export interface ReportProblemOriginContext {
  paginaUrl?: string | null;
  pathname?: string | null;
  currentPage?: string | null;
  currentTab?: string | null;
  pageType?: string | null;
}

export interface ReportProblemCourseContext {
  contextType?: 'course' | 'workshop';
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  currentTab?: string;
  currentPage?: string;
}

export interface ReportProblemRequestContext {
  conversationId?: string | null;
  pageType?: string | null;
  currentTab?: string | null;
  originContext?: Partial<ReportProblemOriginContext>;
  courseContext?: ReportProblemCourseContext | null;
}

export interface ReportProblemIrisSyncMetadata {
  externalSystem: 'IRIS';
  status: ReportProblemIrisSyncStatus;
  externalIssueId?: string | null;
  lastAttemptAt?: string | null;
}

export interface ReportProblemLiaMetadata {
  conversationId?: string | null;
  recordingStatus?: string | null;
  hasSessionRecording: boolean;
  recordingUrl?: string | null;
  detectedAsBug?: boolean;
  aiGeneratedTitle?: string | null;
  chatMessageContent?: string | null;
  clientDiagnostics?: Record<string, unknown>;
}

export interface ReportProblemClientMetadata {
  userAgent?: string | null;
  screenResolution?: string | null;
  browser?: string | null;
}

export interface ReportProblemMetadata {
  source: ReportProblemSource;
  fromLia: boolean;
  reportedAt: string;
  originContext: ReportProblemOriginContext;
  courseContext?: ReportProblemCourseContext | null;
  attachments?: UploadedReportAttachment[];
  attachmentUploadWarnings?: string[];
  irisSync: ReportProblemIrisSyncMetadata;
  liaContext?: ReportProblemLiaMetadata;
  clientContext?: ReportProblemClientMetadata;
}
