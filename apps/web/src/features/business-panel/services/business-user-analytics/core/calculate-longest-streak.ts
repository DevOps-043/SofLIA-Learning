export function calculateLongestStreak(dateKeys: string[]): number {
  let longest = 0
  let current = 0
  let previousTime: number | null = null

  dateKeys.forEach((key) => {
    const time = new Date(`${key}T00:00:00.000Z`).getTime()
    if (previousTime !== null && time - previousTime === 86_400_000) {
      current += 1
    } else {
      current = 1
    }

    longest = Math.max(longest, current)
    previousTime = time
  })

  return longest
}
