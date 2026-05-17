import type { TimeEstimationConfidence } from '../courseTimeEstimation.types'

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeConfidence(value: unknown): TimeEstimationConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  return 'medium'
}
