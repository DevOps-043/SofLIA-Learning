export const MAX_ACTIVITY_COMPLETION_ATTEMPTS = 3;

export interface ActivityCompletionAttemptRecord {
  completion_id: string;
  status?: string | null;
}

export type ActivityCompletionAttemptDecision =
  | {
      kind: 'already_completed';
      completionId: string;
    }
  | {
      kind: 'limit_reached';
    }
  | {
      kind: 'can_create';
      attemptNumber: number;
    };

export function resolveActivityCompletionAttempt(
  completionRows: ActivityCompletionAttemptRecord[],
  maxAttempts = MAX_ACTIVITY_COMPLETION_ATTEMPTS
): ActivityCompletionAttemptDecision {
  const alreadyCompleted = completionRows.find(
    (completion) => completion.status === 'completed'
  );

  if (alreadyCompleted) {
    return {
      kind: 'already_completed',
      completionId: alreadyCompleted.completion_id,
    };
  }

  if (completionRows.length >= maxAttempts) {
    return { kind: 'limit_reached' };
  }

  return {
    kind: 'can_create',
    attemptNumber: completionRows.length + 1,
  };
}
