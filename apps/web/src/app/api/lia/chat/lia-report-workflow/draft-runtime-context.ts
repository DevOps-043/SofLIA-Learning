import { uploadReportImageAttachments } from '../../../../../core/reporting/report-problem.server';
import type { ChatRequest } from '../platform-context.service';
import { mergeUploadedAttachments } from './attachment-utils';
import {
  buildCourseContext,
  buildLiaDiagnostics,
  buildOriginContext,
  buildScreenResolution,
} from './context-builders';
import { uploadSessionRecording } from './recording-upload';
import {
  BugReportDraftRuntimeContext,
  LiaChatProcessingBody,
} from './types';
import { asRecord, readString, readNumber } from './value-readers';

export async function buildDraftRuntimeContext(
  body: LiaChatProcessingBody,
  requestContext: ChatRequest['context'],
  previousRuntimeContext?: BugReportDraftRuntimeContext
): Promise<BugReportDraftRuntimeContext> {
  const lastMessage = body.messages[body.messages.length - 1];
  const metadataRecord = asRecord(body.enrichedMetadata);
  const recordingInfoRecord = asRecord(metadataRecord?.recordingInfo);

  let uploadedAttachments = previousRuntimeContext?.attachments || [];
  let attachmentUploadWarnings = previousRuntimeContext?.attachmentUploadWarnings || [];
  let recordingUrl = previousRuntimeContext?.recordingUrl || null;

  if (requestContext?.userId && lastMessage?.attachments?.length) {
    const uploadResult = await uploadReportImageAttachments(lastMessage.attachments, requestContext.userId);
    uploadedAttachments = mergeUploadedAttachments(uploadedAttachments, uploadResult.assets);
    attachmentUploadWarnings = [...attachmentUploadWarnings, ...uploadResult.warnings];
  }

  if (requestContext?.userId && body.sessionSnapshot) {
    const uploadedRecordingUrl = await uploadSessionRecording(body.sessionSnapshot, requestContext.userId);
    if (uploadedRecordingUrl) recordingUrl = uploadedRecordingUrl;
  }

  const originalUserMessage = previousRuntimeContext?.originalUserMessage || lastMessage?.content || '';
  const recordingDurationSeconds =
    metadataRecord?.sessionDuration && readNumber(metadataRecord.sessionDuration)
      ? Math.round(Number(metadataRecord.sessionDuration) / 1000)
      : previousRuntimeContext?.recordingDurationSeconds || null;

  return {
    originalUserMessage,
    originContext: previousRuntimeContext?.originContext || buildOriginContext(requestContext),
    courseContext: previousRuntimeContext?.courseContext || buildCourseContext(requestContext),
    attachments: uploadedAttachments,
    attachmentUploadWarnings,
    recordingUrl,
    recordingStatus: body.recordingStatus || previousRuntimeContext?.recordingStatus || 'unknown',
    recordingSize: readString(recordingInfoRecord?.size) || previousRuntimeContext?.recordingSize || null,
    recordingDurationSeconds,
    screenResolution: buildScreenResolution(body.enrichedMetadata) || previousRuntimeContext?.screenResolution || null,
    browser: readString(metadataRecord?.platform) || previousRuntimeContext?.browser || null,
    clientDiagnostics: metadataRecord
      ? buildLiaDiagnostics(body, originalUserMessage, recordingUrl)
      : previousRuntimeContext?.clientDiagnostics || {},
  };
}
