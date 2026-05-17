import type { TimeEstimationTargetType } from '../courseTimeEstimation.types'

export interface TimeRange {
  min: number
  max: number
}

const TIME_RANGES: Record<TimeEstimationTargetType, TimeRange> = {
  pdf: { min: 2, max: 45 },
  link: { min: 2, max: 20 },
  document: { min: 2, max: 45 },
  quiz: { min: 3, max: 20 },
  exercise: { min: 4, max: 14 },
  reading: { min: 1, max: 45 },
  reflection: { min: 3, max: 8 },
  discussion: { min: 4, max: 10 },
  ai_chat: { min: 3, max: 8 },
}

export function clamp(value: number, range: TimeRange): number {
  return Math.min(range.max, Math.max(range.min, value))
}

export function getTargetRange(
  targetType: TimeEstimationTargetType,
): TimeRange {
  return TIME_RANGES[targetType]
}
