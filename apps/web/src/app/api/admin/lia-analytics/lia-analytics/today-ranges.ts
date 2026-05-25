export function getTodayComparisonRange() {
  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  )
  const todayEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  )
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
  const yesterdayEnd = new Date(todayStart)
  yesterdayEnd.setUTCMilliseconds(yesterdayEnd.getUTCMilliseconds() - 1)

  return { todayEnd, todayStart, yesterdayEnd, yesterdayStart }
}
