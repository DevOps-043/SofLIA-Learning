import type { LearnActivity, LearnActivitySubmission } from '../../types';
import type { ActivityFormState, SubmissionRequestPayload } from './types';

export function buildInitialState(activity: LearnActivity): ActivityFormState {
  const activityConfig = activity.activity_config;
  const inlineAnswers =
    activityConfig?.interactionType === 'inline_answers'
      ? Object.fromEntries(activityConfig.submission.fields.map((field) => [field.id, '']))
      : {};
  const checklist =
    activityConfig?.interactionType === 'checklist'
      ? Object.fromEntries(activityConfig.submission.checklistItems.map((item) => [item.id, false]))
      : {};

  return { checklist, evidenceText: '', inlineAnswers, responseText: '' };
}

export function buildSubmissionRequest(
  activity: LearnActivity,
  state: ActivityFormState
): SubmissionRequestPayload {
  const activityConfig = activity.activity_config;
  const evidencePayload = state.evidenceText.trim()
    ? { text: state.evidenceText.trim() }
    : null;

  if (activityConfig?.interactionType === 'inline_answers') {
    return { evidencePayload, responsePayload: { answers: state.inlineAnswers }, responseText: state.responseText };
  }
  if (activityConfig?.interactionType === 'checklist') {
    return { evidencePayload, responsePayload: { checklist: state.checklist, text: state.responseText }, responseText: state.responseText };
  }
  if (activityConfig?.interactionType === 'external_tool_task') {
    return { evidencePayload, responsePayload: { text: state.responseText, toolKey: activityConfig.toolTask.toolKey }, responseText: state.responseText };
  }

  return { evidencePayload, responsePayload: { text: state.responseText }, responseText: state.responseText };
}

export function applySubmissionToState(
  activity: LearnActivity,
  submission: LearnActivitySubmission | null
): ActivityFormState {
  const baseState = buildInitialState(activity);
  if (!submission) return baseState;

  const responsePayload = submission.responsePayload || {};
  const evidencePayload = submission.evidencePayload || {};

  return {
    checklist: {
      ...baseState.checklist,
      ...readRecord<boolean>(responsePayload.checklist)
    },
    evidenceText: typeof evidencePayload.text === 'string' ? evidencePayload.text : '',
    inlineAnswers: {
      ...baseState.inlineAnswers,
      ...readRecord<string>(responsePayload.answers)
    },
    responseText:
      submission.responseText ||
      (typeof responsePayload.text === 'string' ? responsePayload.text : '')
  };
}

function readRecord<TValue>(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, TValue>)
    : {};
}
