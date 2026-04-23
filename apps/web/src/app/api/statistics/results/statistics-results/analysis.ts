import { calculateResponseScore, isCorrectKnowledgeAnswer } from './answer-scoring'
import {
  getAdoptionDescription,
  getKnowledgeDescription,
  getLevel,
} from './analysis-descriptions'
import { AnalysisSummary, StatisticsResponseRow, StatisticsUserProfile } from './types'

export function processAnalysis(
  responses: StatisticsResponseRow[],
  _userProfile: StatisticsUserProfile,
): AnalysisSummary {
  const adoptionResponses = responses.filter((response) => isAdoptionResponse(response))
  const knowledgeResponses = responses.filter((response) => isKnowledgeResponse(response))
  const adoptionScore = adoptionResponses.length > 0
    ? Math.round(adoptionResponses.reduce((sum, response) => sum + calculateResponseScore(response), 0) / adoptionResponses.length)
    : 0

  const correctAnswers = knowledgeResponses.filter((response) => isCorrectKnowledgeAnswer(response)).length
  const knowledgeScore = knowledgeResponses.length > 0 ? Math.round((correctAnswers / knowledgeResponses.length) * 100) : 0

  return {
    adoption: {
      score: adoptionScore,
      level: getLevel(adoptionScore),
      description: getAdoptionDescription(adoptionScore),
      totalQuestions: adoptionResponses.length,
    },
    knowledge: {
      score: knowledgeScore,
      correct: correctAnswers,
      total: knowledgeResponses.length,
      level: getLevel(knowledgeScore),
      description: getKnowledgeDescription(knowledgeScore, correctAnswers, knowledgeResponses.length),
    },
  }
}

function isAdoptionResponse(response: StatisticsResponseRow) {
  const section = normalizeComparableText(response.preguntas?.section)
  const bloque = normalizeComparableText(response.preguntas?.bloque)
  return section === 'adopcion' || bloque === 'adopcion'
}

function isKnowledgeResponse(response: StatisticsResponseRow) {
  const section = normalizeComparableText(response.preguntas?.section)
  const bloque = normalizeComparableText(response.preguntas?.bloque)
  return section === 'conocimiento' || bloque === 'conocimiento'
}

function normalizeComparableText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
