import type { ChatRequest } from '../platform-context.service'
import type {
  BugReportDraftTokenPayload,
  BugReportTokenPayload,
  LiaChatProcessingBody,
  PreparedDraftResponse,
} from './types'
import { buildDraftRuntimeContext } from './runtime-context'
import { normalizeBugCategory, normalizeBugPriority, readString } from './parsing'
import {
  BUG_REPORT_DRAFT_REGEX,
  BUG_REPORT_REGEX,
  ensureConfirmationPrompt,
  extractToken,
  serializeDraftToken,
  stripTokenMarkers,
} from './token-markers'

export async function prepareDraftResponseForPersistence(params: {
  finalContent: string
  body: LiaChatProcessingBody
  requestContext: ChatRequest['context']
  previousDraft?: BugReportDraftTokenPayload | null
}): Promise<PreparedDraftResponse | null> {
  const { finalContent, body, requestContext, previousDraft } = params
  const draftMatch = extractToken<BugReportDraftTokenPayload>(finalContent, BUG_REPORT_DRAFT_REGEX)
  const legacyDraftMatch = draftMatch
    ? null
    : extractToken<BugReportTokenPayload>(finalContent, BUG_REPORT_REGEX)
  const baseDraft = draftMatch?.payload || legacyDraftMatch?.payload

  if (!baseDraft) return null

  const runtimeContext = await buildDraftRuntimeContext(
    body,
    requestContext,
    previousDraft?.runtimeContext,
  )
  const normalizedDraft: BugReportDraftTokenPayload = {
    schemaVersion: 1,
    status: 'draft',
    title: readString(baseDraft.title) || readString(previousDraft?.title) || 'Reporte tecnico desde SofLIA',
    description:
      readString(baseDraft.description) ||
      readString(previousDraft?.description) ||
      runtimeContext.originalUserMessage,
    category: normalizeBugCategory(readString(baseDraft.category) || readString(previousDraft?.category)),
    priority: normalizeBugPriority(readString(baseDraft.priority) || readString(previousDraft?.priority)),
    runtimeContext,
  }
  const sourceToken = draftMatch?.token || legacyDraftMatch?.token

  return {
    clientContent: ensureConfirmationPrompt(stripTokenMarkers(finalContent)),
    assistantContentToPersist: sourceToken
      ? finalContent.replace(sourceToken, serializeDraftToken(normalizedDraft))
      : `${finalContent}\n\n${serializeDraftToken(normalizedDraft)}`,
    draft: normalizedDraft,
  }
}
