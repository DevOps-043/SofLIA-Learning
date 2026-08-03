import { describe, expect, it } from 'vitest';

import { retryAvailableAt } from '@/features/courses/services/attempt-cooldown';

import {
  MAX_ACTIVITY_COMPLETION_ATTEMPTS,
  resolveActivityCompletionAttempt,
  type ActivityCompletionAttemptRecord,
} from '../activity-completion-attempts.service';

/** `n` intentos fallidos dentro de la ventana (11:01, 11:02, …). */
function failedAttempts(count: number): ActivityCompletionAttemptRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    completion_id: `attempt-${index + 1}`,
    status: 'failed',
    started_at: `2026-08-03T11:${String(index + 1).padStart(2, '0')}:00.000Z`,
  }));
}

describe('resolveActivityCompletionAttempt', () => {
  it('allows creating the first attempt when there are no previous rows', () => {
    expect(
      resolveActivityCompletionAttempt({ allAttempts: [], attemptsInWindow: [] })
    ).toEqual({
      kind: 'can_create',
      attemptNumber: 1,
    });
  });

  it('counts failed or incomplete rows toward the limit', () => {
    const attempts = failedAttempts(2);

    expect(
      resolveActivityCompletionAttempt({
        allAttempts: attempts,
        attemptsInWindow: attempts,
      })
    ).toEqual({ kind: 'can_create', attemptNumber: 3 });
  });

  it('blocks once the limit is consumed and says when attempts come back', () => {
    const attempts = failedAttempts(MAX_ACTIVITY_COMPLETION_ATTEMPTS);

    expect(
      resolveActivityCompletionAttempt({
        allAttempts: attempts,
        attemptsInWindow: attempts,
      })
    ).toEqual({
      kind: 'limit_reached',
      // El intento más antiguo libera cupo una hora después.
      retryAfter: retryAvailableAt(attempts[0].started_at as string),
    });
  });

  it('frees quota again once the attempts leave the cooldown window', () => {
    const attempts = failedAttempts(MAX_ACTIVITY_COMPLETION_ATTEMPTS);

    expect(
      resolveActivityCompletionAttempt({
        allAttempts: attempts,
        // Ninguno sigue dentro de la ventana: el alumno recupera todos sus intentos.
        attemptsInWindow: [],
      })
    ).toEqual({ kind: 'can_create', attemptNumber: 1 });
  });

  it('returns the completed row idempotently even if it left the window', () => {
    const completed: ActivityCompletionAttemptRecord = {
      completion_id: 'attempt-2',
      status: 'completed',
      started_at: '2026-08-01T10:00:00.000Z',
    };

    expect(
      resolveActivityCompletionAttempt({
        allAttempts: [...failedAttempts(1), completed],
        attemptsInWindow: [],
      })
    ).toEqual({
      kind: 'already_completed',
      completionId: 'attempt-2',
    });
  });

  it('keeps the product limit at 5 attempts per activity', () => {
    expect(MAX_ACTIVITY_COMPLETION_ATTEMPTS).toBe(5);
  });
});
