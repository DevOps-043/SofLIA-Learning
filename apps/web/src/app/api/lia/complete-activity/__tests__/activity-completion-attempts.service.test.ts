import { describe, expect, it } from 'vitest';

import {
  MAX_ACTIVITY_COMPLETION_ATTEMPTS,
  resolveActivityCompletionAttempt,
} from '../activity-completion-attempts.service';

describe('resolveActivityCompletionAttempt', () => {
  it('allows creating the first attempt when there are no previous rows', () => {
    expect(resolveActivityCompletionAttempt([])).toEqual({
      kind: 'can_create',
      attemptNumber: 1,
    });
  });

  it('counts failed or incomplete rows toward the total attempt limit', () => {
    expect(
      resolveActivityCompletionAttempt([
        { completion_id: 'attempt-1', status: 'failed' },
        { completion_id: 'attempt-2', status: 'abandoned' },
      ])
    ).toEqual({
      kind: 'can_create',
      attemptNumber: 3,
    });
  });

  it('blocks the fourth attempt even when none of the previous attempts completed', () => {
    expect(
      resolveActivityCompletionAttempt([
        { completion_id: 'attempt-1', status: 'failed' },
        { completion_id: 'attempt-2', status: 'failed' },
        { completion_id: 'attempt-3', status: 'abandoned' },
      ])
    ).toEqual({ kind: 'limit_reached' });
  });

  it('returns the completed row idempotently without consuming another attempt', () => {
    expect(
      resolveActivityCompletionAttempt(
        [
          { completion_id: 'attempt-1', status: 'failed' },
          { completion_id: 'attempt-2', status: 'completed' },
          { completion_id: 'attempt-3', status: 'failed' },
        ],
        MAX_ACTIVITY_COMPLETION_ATTEMPTS
      )
    ).toEqual({
      kind: 'already_completed',
      completionId: 'attempt-2',
    });
  });
});
