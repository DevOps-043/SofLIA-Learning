export function getProjectionMetrics(input: {
  endDate: Date
  startDate: Date
  totalCostUsd: number
}) {
  const daysInPeriod = Math.ceil(
    (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const avgDailyCost = daysInPeriod > 0 ? input.totalCostUsd / daysInPeriod : 0

  return {
    dailyAvg: Number(avgDailyCost.toFixed(6)),
    monthlyEstimate: Number((avgDailyCost * 30).toFixed(4)),
  }
}
