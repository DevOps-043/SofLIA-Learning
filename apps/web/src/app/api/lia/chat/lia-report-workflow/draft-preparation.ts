import type { ChatRequest } from '../platform-context.service';
import { BUG_REPORT_DRAFT_REGEX, BUG_REPORT_REGEX } from './constants';
import { buildDraftRuntimeContext } from './draft-runtime-context';
import { normalizeBugCategory, normalizeBugPriority } from './normalization';
import { ensureConfirmationPrompt } from './prompt-utils';
import {
  BugReportDraftTokenPayload,
  BugReportTokenPayload,
  LiaChatProcessingBody,
  PreparedDraftResponse,
} from './types';
import {
  extractToken,
  serializeDraftToken,
  stripTokenMarkers,
} from './token-utils';
import { readString } from './value-readers';

export async function prepareDraftResponseForPersistence(params: {
  finalContent: string;
  body: LiaChatProcessingBody;
  requestContext: ChatRequest['context'];
  previousDraft?: BugReportDraftTokenPayload | null;
}): Promise<PreparedDraftResponse | null> {
  const { finalContent, body, requestContext, previousDraft } = params;
  const draftMatch = extractToken<BugReportDraftTokenPayload>(finalContent, BUG_REPORT_DRAFT_REGEX);
  const legacyDraftMatch = draftMatch ? null : extractToken<BugReportTokenPayload>(finalContent, BUG_REPORT_REGEX);
  const baseDraft = draftMatch?.payload || legacyDraftMatch?.payload;
  if (!baseDraft) return null;

  const runtimeContext = await buildDraftRuntimeContext(body, requestContext, previousDraft?.runtimeContext);
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
  };

  const sourceToken = draftMatch?.token || legacyDraftMatch?.token;
  const clientContent = ensureConfirmationPrompt(stripTokenMarkers(finalContent));
  const assistantContentToPersist = sourceToken
    ? finalContent.replace(sourceToken, serializeDraftToken(normalizedDraft))
    : `${finalContent}\n\n${serializeDraftToken(normalizedDraft)}`;

  return { clientContent, assistantContentToPersist, draft: normalizedDraft };
}
