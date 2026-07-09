import { INACTIVITY_THRESHOLD_SECONDS } from './constants'
import type { DialogueTurnTimestamp } from './types'

/**
 * Duplicate of apps/web/src/features/courses/services/soflia-dialogue/dialogue-session/compute-active-seconds.ts
 * (see that file's tests for the covered cases). Netlify Functions are
 * self-contained bundles, so this pure function is copied rather than
 * imported. Keep both in sync.
 */
export function computeDialogueActiveSeconds(
  turns: DialogueTurnTimestamp[],
  thresholdSeconds: number = INACTIVITY_THRESHOLD_SECONDS,
): number {
  if (turns.length < 2) return 0

  const timestampsMs = turns
    .map((turn) => new Date(turn.created_at).getTime())
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => a - b)

  let totalSeconds = 0
  for (let i = 1; i < timestampsMs.length; i += 1) {
    const gapSeconds = (timestampsMs[i] - timestampsMs[i - 1]) / 1000
    if (gapSeconds <= 0) continue
    totalSeconds += Math.min(gapSeconds, thresholdSeconds)
  }

  return Math.round(totalSeconds)
}
