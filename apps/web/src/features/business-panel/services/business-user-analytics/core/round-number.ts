export function roundNumber(value: number, decimals = 1): number {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}
