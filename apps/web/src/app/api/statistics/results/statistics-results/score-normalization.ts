export function normalizeScoreByDifficulty(
  score: number,
  userDifficulty: number | null | undefined,
): number {
  if (!userDifficulty || userDifficulty < 1 || userDifficulty > 5) {
    return score
  }

  const maxScoreByDifficulty: Record<number, number> = {
    1: 20,
    2: 40,
    3: 60,
    4: 80,
    5: 100,
  }

  const maxScore = maxScoreByDifficulty[userDifficulty] || 100
  return Math.round((score * maxScore) / 100)
}
