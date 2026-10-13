/** Leave time to persist the generated note and finalize its queue lease. */
export function generationTimeoutBeforeDeadline(deadlineAt?: number): number | undefined {
  if (deadlineAt === undefined) return undefined
  const remainingMs = deadlineAt - Date.now() - 5_000
  if (remainingMs <= 0) throw new Error('AI_GENERATION_RUNTIME_BUDGET_EXHAUSTED')
  return Math.min(12_000, remainingMs)
}
