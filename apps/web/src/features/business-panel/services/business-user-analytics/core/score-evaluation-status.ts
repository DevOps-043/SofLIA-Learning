export function scoreEvaluationStatus(status: string | null | undefined): number {
  if (status === 'pass') return 100
  if (status === 'revise') return 55
  if (status === 'error') return 0
  return 0
}
