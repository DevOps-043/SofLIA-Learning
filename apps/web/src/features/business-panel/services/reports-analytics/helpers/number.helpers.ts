export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

export function calculatePercentage(value: number, total: number): number {
  if (!total) return 0
  return clampPercentage((value / total) * 100)
}

export function calculateAverage(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value))
  if (validValues.length === 0) return 0

  const total = validValues.reduce((sum, value) => sum + value, 0)
  return Math.round((total / validValues.length) * 10) / 10
}

export function calculateMedian(values: number[]): number {
  const validValues = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)

  if (validValues.length === 0) return 0

  const midpoint = Math.floor(validValues.length / 2)
  const median = validValues.length % 2
    ? validValues[midpoint]
    : (validValues[midpoint - 1] + validValues[midpoint]) / 2

  return Math.round(median * 10) / 10
}

export function calculateQualityScore(
  parts: Array<number | null | undefined>,
): number {
  const validParts = parts.filter((value): value is number =>
    Number.isFinite(value),
  )
  return clampPercentage(calculateAverage(validParts))
}

export function calculateRankScore(input: {
  averageProgress: number
  completionRate: number
  sofliaAdoptionRate: number
  notesAdoptionRate: number
  qualityScore: number
  overdueAssignments: number
  users: number
}): number {
  const overduePenalty = input.users > 0
    ? Math.min(20, (input.overdueAssignments / input.users) * 5)
    : 0

  return clampPercentage(
    input.averageProgress * 0.25 +
      input.completionRate * 0.25 +
      input.qualityScore * 0.2 +
      input.sofliaAdoptionRate * 0.15 +
      input.notesAdoptionRate * 0.15 -
      overduePenalty,
  )
}
