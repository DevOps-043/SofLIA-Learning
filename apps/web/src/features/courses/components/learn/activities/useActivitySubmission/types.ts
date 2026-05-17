import type { LearnActivity, LearnActivitySubmission } from '../../types';

export type ActivityFormState = {
  checklist: Record<string, boolean>;
  evidenceText: string;
  inlineAnswers: Record<string, string>;
  responseText: string;
};

export interface UseActivitySubmissionParams {
  activity: LearnActivity;
  lessonId: string;
  onSubmissionSaved?: () => void | Promise<void>;
  slug: string;
}

export interface SubmissionRequestPayload {
  evidencePayload: { text: string } | null;
  responsePayload: Record<string, unknown>;
  responseText: string;
}

export interface ActivitySubmissionApiPayload {
  evaluation?: unknown;
  submission?: LearnActivitySubmission | null;
}
