export function getNonNegativeNumber(value: unknown): number {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) return 0
  return numberValue
}
