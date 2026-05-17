export function buildSixMonthsAgoIso() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return sixMonthsAgo.toISOString()
}

export function buildActiveSinceDate() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return thirtyDaysAgo.toISOString().split('T')[0]
}
