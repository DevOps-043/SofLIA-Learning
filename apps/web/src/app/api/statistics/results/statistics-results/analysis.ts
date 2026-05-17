import { getAdoptionDescription, getKnowledgeDescription } from './descriptions';
import { getLevel, parseJsonStringValue, scoreAnswerValue } from './score-utils';
import type { AnalysisSummary, StatisticsResponseRow } from './types';

const ADOPTION_LABELS = ['Adopción', 'AdopciÃ³n', 'Adopcion'];

export function processAnalysis(responses: StatisticsResponseRow[]): AnalysisSummary {
  const adoptionResponses = responses.filter(isAdoptionQuestion);
  const knowledgeResponses = responses.filter(isKnowledgeQuestion);
  const adoptionScore = getAverageAdoptionScore(adoptionResponses);
  const correctAnswers = countCorrectAnswers(knowledgeResponses);
  const knowledgeScore = knowledgeResponses.length > 0
    ? Math.round((correctAnswers / knowledgeResponses.length) * 100)
    : 0;

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
  };
}

function isAdoptionQuestion(response: StatisticsResponseRow) {
  return (
    ADOPTION_LABELS.includes(response.preguntas?.section || '') ||
    ADOPTION_LABELS.includes(response.preguntas?.bloque || '') ||
    (response.preguntas?.section === 'Cuestionario' && ADOPTION_LABELS.includes(response.preguntas?.bloque || ''))
  );
}

function isKnowledgeQuestion(response: StatisticsResponseRow) {
  return (
    response.preguntas?.section === 'Conocimiento' ||
    response.preguntas?.bloque === 'Conocimiento' ||
    (response.preguntas?.section === 'Cuestionario' && response.preguntas?.bloque === 'Conocimiento')
  );
}

function getAverageAdoptionScore(responses: StatisticsResponseRow[]) {
  if (responses.length === 0) return 0;
  const total = responses.reduce((sum, response) => sum + scoreAnswerValue(response.valor), 0);
  return Math.round(total / responses.length);
}

function countCorrectAnswers(responses: StatisticsResponseRow[]) {
  return responses.reduce((correct, response) => {
    const correctAnswer = response.preguntas?.respuesta_correcta;
    const userAnswer = parseJsonStringValue(response.valor);
    return correct + (correctAnswer && userAnswer === correctAnswer ? 1 : 0);
  }, 0);
}
