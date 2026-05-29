export const VIDEO_COMPLETION_PERCENT = 95;
export const MAX_FORWARD_PROGRESS_JUMP_SECONDS = 8;

interface NormalizeVideoProgressInput {
  checkpoint: number;
  currentMaxReached: number;
  incomingMaxReached: number;
  totalDuration: number;
}

export interface NormalizedVideoProgress {
  safeCheckpoint: number;
  safeMaxReached: number;
  videoProgressPercentage: number;
}

export function clampVideoTime(value: number, totalDuration: number): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeDuration = totalDuration > 0 ? totalDuration : Number.POSITIVE_INFINITY;

  return Math.max(0, Math.min(Math.floor(safeValue), safeDuration));
}

export function normalizeVideoProgress({
  checkpoint,
  currentMaxReached,
  incomingMaxReached,
  totalDuration,
}: NormalizeVideoProgressInput): NormalizedVideoProgress {
  const safeCurrentMax = clampVideoTime(currentMaxReached, totalDuration);
  const safeIncomingMax = clampVideoTime(incomingMaxReached, totalDuration);
  const maxAllowedByPreviousProgress = safeCurrentMax + MAX_FORWARD_PROGRESS_JUMP_SECONDS;
  const safeMaxReached = Math.max(
    safeCurrentMax,
    Math.min(safeIncomingMax, maxAllowedByPreviousProgress),
  );
  const safeCheckpoint = Math.min(
    clampVideoTime(checkpoint, totalDuration),
    safeMaxReached,
  );

  return {
    safeCheckpoint,
    safeMaxReached,
    videoProgressPercentage: totalDuration > 0
      ? Math.min(100, Math.round((safeMaxReached / totalDuration) * 100))
      : 0,
  };
}

export function buildSafeResumeCheckpoint({
  checkpoint,
  completionPercentage,
  isCompleted,
  maxReached,
}: {
  checkpoint: number;
  completionPercentage: number;
  isCompleted: boolean;
  maxReached: number;
}): number {
  const safeCheckpoint = Math.max(0, Math.floor(checkpoint || 0));
  const safeMaxReached = Math.max(0, Math.floor(maxReached || 0));

  if (isCompleted || completionPercentage >= VIDEO_COMPLETION_PERCENT) {
    return safeCheckpoint;
  }

  return Math.min(safeCheckpoint, safeMaxReached);
}
