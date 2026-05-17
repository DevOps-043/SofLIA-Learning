import { uploadReportImageAttachments } from '@/core/reporting/report-problem.server'
import type { UploadedReportAttachment } from '@/core/reporting/report-problem.contract'
import type { ChatRequest } from '../platform-context.service'
import type { BugReportDraftRuntimeContext, LiaChatProcessingBody } from './types'
import {
  buildCourseContext,
  buildLiaDiagnostics,
  buildOriginContext,
  buildScreenResolution,
} from './context-builders'
import { asRecord, readString } from './parsing'

export async function buildDraftRuntimeContext(
  body: LiaChatProcessingBody,
  requestContext: ChatRequest['context'],
  previousRuntimeContext?: BugReportDraftRuntimeContext,
): Promise<BugReportDraftRuntimeContext> {
  const lastMessage = body.messages[body.messages.length - 1]
  const metadataRecord = asRecord(body.enrichedMetadata)
  let uploadedAttachments = previousRuntimeContext?.attachments || []
  let attachmentUploadWarnings = previousRuntimeContext?.attachmentUploadWarnings || []

  if (requestContext?.userId && lastMessage?.attachments?.length) {
    const uploadResult = await uploadReportImageAttachments(lastMessage.attachments, requestContext.userId)
    uploadedAttachments = mergeUploadedAttachments(uploadedAttachments, uploadResult.assets)
    attachmentUploadWarnings = [...attachmentUploadWarnings, ...uploadResult.warnings]
  }

  const originalUserMessage =
    previousRuntimeContext?.originalUserMessage || lastMessage?.content || ''

  return {
    originalUserMessage,
    originContext: previousRuntimeContext?.originContext || buildOriginContext(requestContext),
    courseContext: previousRuntimeContext?.courseContext || buildCourseContext(requestContext),
    attachments: uploadedAttachments,
    attachmentUploadWarnings,
    screenResolution:
      buildScreenResolution(body.enrichedMetadata) ||
      previousRuntimeContext?.screenResolution ||
      null,
    browser: readString(metadataRecord?.platform) || previousRuntimeContext?.browser || null,
    clientDiagnostics: metadataRecord
      ? buildLiaDiagnostics(body, originalUserMessage)
      : previousRuntimeContext?.clientDiagnostics || {},
  }
}

function mergeUploadedAttachments(
  existingAttachments: UploadedReportAttachment[],
  newAttachments: UploadedReportAttachment[],
): UploadedReportAttachment[] {
  const deduplicated = new Map<string, UploadedReportAttachment>()

  ;[...existingAttachments, ...newAttachments].forEach(attachment => {
    const key =
      attachment.storagePath ||
      `${attachment.fileName}-${attachment.size}-${attachment.publicUrl}`
    deduplicated.set(key, attachment)
  })

  return Array.from(deduplicated.values())
}
