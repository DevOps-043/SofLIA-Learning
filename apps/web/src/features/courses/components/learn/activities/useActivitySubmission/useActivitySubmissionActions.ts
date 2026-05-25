import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { LearnActivity, LearnActivitySubmission } from '../../types';
import {
  summarizeActivitySubmissionRequirementIssues,
  type ActivitySubmissionRequirementIssue
} from '@/features/courses/services/activity-submission-requirements.service';
import { postActivitySubmission, validateActivitySubmission } from './activity-submission-api';
import { applySubmissionToState } from './activity-submission-state';
import type { ActivityFormState, SubmissionRequestPayload } from './types';

interface UseActivitySubmissionActionsParams {
  activity: LearnActivity;
  lessonId: string;
  onSubmissionSaved?: () => void | Promise<void>;
  requestPayload: SubmissionRequestPayload;
  setError: Dispatch<SetStateAction<string | null>>;
  setFeedbackMessage: Dispatch<SetStateAction<string | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setState: Dispatch<SetStateAction<ActivityFormState>>;
  setSubmission: Dispatch<SetStateAction<LearnActivitySubmission | null>>;
  setValidating: Dispatch<SetStateAction<boolean>>;
  slug: string;
  submissionRequirementIssues: ActivitySubmissionRequirementIssue[];
}

export function useActivitySubmissionActions(params: UseActivitySubmissionActionsParams) {
  const saveSubmission = useCallback(async (status: 'draft' | 'submitted') => {
    if (status === 'submitted' && params.submissionRequirementIssues.length > 0) {
      params.setError(summarizeActivitySubmissionRequirementIssues(params.submissionRequirementIssues));
      return;
    }

    await runSubmissionMutation({
      ...params,
      mutation: () => postActivitySubmission(params.slug, params.lessonId, params.activity, params.requestPayload, status),
      setBusy: params.setSaving,
      successMessage: status === 'draft' ? 'Borrador guardado.' : 'Actividad enviada correctamente.'
    });
  }, [params]);

  const validateWithSoflia = useCallback(async () => {
    await runSubmissionMutation({
      ...params,
      mutation: () => validateActivitySubmission(params.slug, params.lessonId, params.activity, params.requestPayload),
      setBusy: params.setValidating,
      successMessage: 'Retroalimentacion de SofLIA actualizada.'
    });
  }, [params]);

  return { saveDraft: () => saveSubmission('draft'), submitActivity: () => saveSubmission('submitted'), validateWithSoflia };
}

async function runSubmissionMutation({
  activity,
  mutation,
  onSubmissionSaved,
  setBusy,
  setError,
  setFeedbackMessage,
  setState,
  setSubmission,
  successMessage
}: UseActivitySubmissionActionsParams & {
  mutation: () => Promise<{ submission?: LearnActivitySubmission | null }>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  successMessage: string;
}) {
  try {
    setBusy(true);
    setError(null);
    const payload = await mutation();
    setSubmission(payload.submission || null);
    if (payload.submission) setState(applySubmissionToState(activity, payload.submission));
    setFeedbackMessage(successMessage);
    await onSubmissionSaved?.();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No fue posible guardar la actividad.');
  } finally {
    setBusy(false);
  }
}
