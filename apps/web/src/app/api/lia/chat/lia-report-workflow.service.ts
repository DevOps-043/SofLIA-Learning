export {
  buildPendingBugReportPromptSection,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  prepareDraftResponseForPersistence,
  stripBugReportTokens,
  submitConfirmedBugReport,
  type BugReportConfirmationIntent,
  type BugReportDraftTokenPayload,
  type LiaChatProcessingBody,
} from './lia-report-workflow';
