import { DIALOGUE_INACTIVITY_THRESHOLD_SECONDS } from './dialogue-timing.constants'

export interface DialogueTimingTurn {
  created_at: string
}

/**
 * Real per-user "active time" for a SofLIA Dialogue session: the sum of the
 * gaps BETWEEN consecutive turns, each capped at `thresholdSeconds`.
 *
 * Time AFTER the last turn (to "now", or to whenever the inactivity cron
 * eventually notices) is intentionally never added — this is what makes
 * tab-abandonment cost nothing, and a mid-conversation thinking pause longer
 * than the threshold only ever contributes the threshold, not the real
 * (larger) idle gap.
 */
export function computeDialogueActiveSeconds(
  turns: DialogueTimingTurn[],
  thresholdSeconds: number = DIALOGUE_INACTIVITY_THRESHOLD_SECONDS,
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
