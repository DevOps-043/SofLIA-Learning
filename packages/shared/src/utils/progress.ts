export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export const isProgressComplete = (
  progress: number,
  threshold: number = 90,
): boolean => {
  return progress >= threshold
}
