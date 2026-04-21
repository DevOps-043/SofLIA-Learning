export function getTimeOfDay(
  timeBlocks: Array<{
    startHour: number
    startMinute?: number
    endHour: number
    endMinute?: number
  }>,
): string {
  if (!timeBlocks || timeBlocks.length === 0) {
    return 'morning'
  }

  let morningCount = 0
  let afternoonCount = 0
  let eveningCount = 0
  let nightCount = 0

  for (const block of timeBlocks) {
    const startTotalMinutes = block.startHour * 60 + (block.startMinute || 0)
    const endTotalMinutes = block.endHour * 60 + (block.endMinute || 0)
    const avgHour = (startTotalMinutes + endTotalMinutes) / 2 / 60

    if (avgHour >= 5 && avgHour < 12) {
      morningCount += 1
    } else if (avgHour >= 12 && avgHour < 17) {
      afternoonCount += 1
    } else if (avgHour >= 17 && avgHour < 21) {
      eveningCount += 1
    } else {
      nightCount += 1
    }
  }

  const max = Math.max(morningCount, afternoonCount, eveningCount, nightCount)
  if (max === morningCount) return 'morning'
  if (max === afternoonCount) return 'afternoon'
  if (max === eveningCount) return 'evening'
  return 'night'
}
