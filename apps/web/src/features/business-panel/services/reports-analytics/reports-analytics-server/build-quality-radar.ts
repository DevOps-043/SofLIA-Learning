import { buildBreakdown } from '../reports-analytics.helpers'

interface QualityRadarScores {
  quizScore: number
  activityScore: number
  sofliaScore: number
  notesScore: number
}

export function buildQualityRadar(scores: QualityRadarScores) {
  return buildBreakdown(
    new Map([
      ['quiz', Math.round(scores.quizScore)],
      ['activity', Math.round(scores.activityScore)],
      ['soflia', Math.round(scores.sofliaScore)],
      ['notes', Math.round(scores.notesScore)],
    ]),
    100,
  )
}
