import type { Json } from '@/lib/supabase/schema/json'

import { ACTIVITY_SUBMISSION_SELECT } from './constants'
import type {
  ActivitySubmissionMutationPayload,
  SupabaseServerClient,
} from './types'

type ActivitySubmissionWritePayload = Omit<
  ActivitySubmissionMutationPayload,
  'evidence_payload' | 'response_payload'
> & {
  evidence_payload: Json | null
  response_payload: Json
}

function toWritePayload(
  payload: ActivitySubmissionMutationPayload,
): ActivitySubmissionWritePayload {
  return {
    ...payload,
    evidence_payload: payload.evidence_payload as Json | null,
    response_payload: payload.response_payload as Json,
  }
}

export async function persistActivitySubmissionPayload(
  supabase: SupabaseServerClient,
  submissionPayload: ActivitySubmissionMutationPayload,
  selectColumns = ACTIVITY_SUBMISSION_SELECT,
) {
  const writePayload = toWritePayload(submissionPayload)
  const { data: existingSubmission, error: lookupError } = await supabase
    .from('user_activity_submissions')
    .select('submission_id')
    .eq('user_id', submissionPayload.user_id)
    .eq('activity_id', submissionPayload.activity_id)
    .eq('enrollment_id', submissionPayload.enrollment_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    return {
      data: null,
      error: lookupError,
    }
  }

  if (existingSubmission?.submission_id) {
    return supabase
      .from('user_activity_submissions')
      .update(writePayload)
      .eq('submission_id', existingSubmission.submission_id)
      .select(selectColumns)
      .single()
  }

  return supabase
    .from('user_activity_submissions')
    .insert(writePayload)
    .select(selectColumns)
    .single()
}
