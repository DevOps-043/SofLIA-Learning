export function isCompletedStatus(status: string | null | undefined): boolean {
  const normalized = status?.toLowerCase()
  return normalized === 'completed' || normalized === 'complete' || normalized === 'finished'
}
