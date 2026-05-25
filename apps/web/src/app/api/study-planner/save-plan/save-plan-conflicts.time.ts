import type { SavePlanSessionInsertRow } from './save-plan.types'
import type { SavePlanSessionConflict } from './save-plan-conflicts.types'

export function parseTime(value: string): number {
  return new Date(value).getTime()
}

export function windowsOverlap(
  leftStartIso: string,
  leftEndIso: string,
  rightStartIso: string,
  rightEndIso: string,
): boolean {
  return parseTime(leftStartIso) < parseTime(rightEndIso)
    && parseTime(rightStartIso) < parseTime(leftEndIso)
}

export function isBlockingSessionStatus(status: string | null): boolean {
  return !status || !['cancelled', 'canceled', 'deleted'].includes(status)
}

export function buildConflict(
  candidate: Pick<SavePlanSessionInsertRow, 'title' | 'start_time' | 'end_time'>,
  conflictingTitle: string,
): SavePlanSessionConflict {
  return {
    candidateTitle: candidate.title,
    conflictingTitle,
    startTime: candidate.start_time,
    endTime: candidate.end_time,
  }
}
