import { calculateResponseScore } from './answer-scoring'
import { matchesDimension } from './dimension-matching'
import { normalizeScoreByDifficulty } from './score-normalization'
import { RadarDimensionScore, StatisticsResponseRow } from './types'

const DIMENSIONS = ['Conocimiento', 'Aplicacion', 'Productividad', 'Estrategia', 'Inversion']

export function processRadarData(
  responses: StatisticsResponseRow[],
  userDifficulty: number | null | undefined = null,
): RadarDimensionScore[] {
  return DIMENSIONS.map((dimension) => {
    const relevantResponses = responses.filter((response) => matchesDimension(response, dimension))
    const { totalScore, totalWeight } = relevantResponses.reduce(
      (result, response) => {
        const weight = response.preguntas?.peso || 1
        return {
          totalScore: result.totalScore + calculateResponseScore(response) * weight,
          totalWeight: result.totalWeight + weight,
        }
      },
      { totalScore: 0, totalWeight: 0 },
    )

    const rawScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
    const normalizedScore = normalizeScoreByDifficulty(rawScore, userDifficulty)
    return {
      dimension,
      score: Math.min(100, Math.max(0, normalizedScore)),
      rawScore,
      maxPossibleScore: userDifficulty ? userDifficulty * 20 : 100,
    }
  })
}
