import { ActivitySubmissionRecord } from './activity-submission-record'
import { redactSensitiveText } from './redact-sensitive-text'
import { stringifySampleContent } from './stringify-sample-content'

export function extractSubmissionText(submission: ActivitySubmissionRecord): string {
  if (submission.response_text?.trim()) {
    return redactSensitiveText(submission.response_text.trim()).slice(0, 900)
  }

  return redactSensitiveText(stringifySampleContent(submission.response_payload)).slice(0, 900)
}
