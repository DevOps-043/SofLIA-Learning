import type { Database } from '@/lib/supabase/types'
import type {
  ReportProblemCourseContext,
  ReportProblemOriginContext,
  UploadedReportAttachment,
} from '@/core/reporting/report-problem.contract'
import type { ChatRequest } from '../platform-context.service'

export type ReportProblemInsert =
  Database['public']['Tables']['reportes_problemas']['Insert']

export interface LiaChatProcessingBody extends ChatRequest {
  isBugReport?: boolean
  enrichedMetadata?: Record<string, unknown>
  conversationId?: string
}

export interface BugReportTokenPayload {
  title?: string
  description?: string
  category?: string
  priority?: string
}

export interface BugReportDraftRuntimeContext {
  originalUserMessage: string
  originContext: ReportProblemOriginContext
  courseContext: ReportProblemCourseContext | null
  attachments: UploadedReportAttachment[]
  attachmentUploadWarnings: string[]
  screenResolution: string | null
  browser: string | null
  clientDiagnostics: Record<string, unknown>
}

export interface BugReportDraftTokenPayload extends BugReportTokenPayload {
  schemaVersion?: 1
  status?: 'draft'
  runtimeContext?: BugReportDraftRuntimeContext
}

export interface ExtractedToken<T> {
  payload: T
  token: string
}

export interface PreparedDraftResponse {
  assistantContentToPersist: string
  clientContent: string
  draft: BugReportDraftTokenPayload
}

export interface ConfirmedBugReportResult {
  bugReportSaved: boolean
  clientContent: string
  /**
   * Texto a guardar en el historial. Difiere de `clientContent` cuando el envio
   * falla: ahi conserva el bloque oculto del borrador para que el usuario pueda
   * reintentar la confirmacion sin volver a describir el problema.
   */
  assistantContentToPersist: string
}

export type BugReportConfirmationIntent = 'confirm' | 'revise' | 'unclear'
