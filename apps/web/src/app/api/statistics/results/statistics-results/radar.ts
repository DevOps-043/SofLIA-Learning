import { normalizeScoreByDifficulty, scoreAnswerValue } from './score-utils';
import type { RadarDimensionScore, StatisticsResponseRow } from './types';

const RADAR_DIMENSIONS = ['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión'];
const ADOPTION_LABELS = ['Adopción', 'AdopciÃ³n', 'Adopcion'];
const TECHNICAL_LABELS = ['Técnico', 'TÃ©cnico', 'Tecnico'];

export function processRadarData(
  responses: StatisticsResponseRow[],
  userDifficulty: number | null | undefined = null,
): RadarDimensionScore[] {
  return RADAR_DIMENSIONS.map((dimension) => {
    const relevantResponses = responses.filter((response) =>
      isResponseForDimension(response, dimension),
    );
    const totals = relevantResponses.reduce(
      (acc, response) => {
        const weight = response.preguntas?.peso || 1;
        return {
          score: acc.score + scoreAnswerValue(response.valor, response.preguntas?.escala) * weight,
          weight: acc.weight + weight,
        };
      },
      { score: 0, weight: 0 },
    );
    const rawScore = totals.weight > 0 ? Math.round(totals.score / totals.weight) : 0;
    const normalizedScore = normalizeScoreByDifficulty(rawScore, userDifficulty);

    return {
      dimension,
      score: Math.min(100, Math.max(0, normalizedScore)),
      rawScore,
      maxPossibleScore: userDifficulty ? userDifficulty * 20 : 100,
    };
  });
}

function isResponseForDimension(response: StatisticsResponseRow, dimension: string): boolean {
  const questionDimensions = response.preguntas?.dimension;
  if (questionDimensions && Array.isArray(questionDimensions)) {
    return questionDimensions.includes(dimension);
  }

  return mapQuestionToDimension(response) === dimension;
}

function mapQuestionToDimension(response: StatisticsResponseRow): string {
  const section = response.preguntas?.section || '';
  const bloque = response.preguntas?.bloque || '';
  const text = response.preguntas?.texto?.toLowerCase() || '';

  if (ADOPTION_LABELS.includes(section) || ADOPTION_LABELS.includes(bloque)) return 'Aplicación';
  if (section === 'Conocimiento' || bloque === 'Conocimiento' || TECHNICAL_LABELS.includes(bloque)) {
    return 'Conocimiento';
  }
  if (section !== 'Cuestionario') return 'Aplicación';
  if (text.includes('productividad') || text.includes('eficiencia')) return 'Productividad';
  if (text.includes('estrategia') || text.includes('planificación') || text.includes('planificacion')) return 'Estrategia';
  if (text.includes('inversión') || text.includes('inversion') || text.includes('presupuesto')) return 'Inversión';
  return 'Aplicación';
}
