import type { AnalysisSummary, RadarDimensionScore, RecommendationItem } from './types';

export function generateRecommendations(
  radarData: RadarDimensionScore[],
  analysis: AnalysisSummary,
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const lowestDimension = radarData.reduce((min, current) =>
    current.score < min.score ? current : min,
  );
  const highestDimension = radarData.reduce((max, current) =>
    current.score > max.score ? current : max,
  );

  if (lowestDimension.score < 40) {
    recommendations.push({
      title: `Mejora en: ${lowestDimension.dimension}`,
      description: `Tu puntuación en ${lowestDimension.dimension} es de ${lowestDimension.score} puntos. Enfócate en desarrollar esta área para equilibrar tu perfil de competencias.`,
      priority: 'high',
    });
  }

  if (analysis.knowledge.score < 50) {
    recommendations.push({
      title: 'Profundiza tus conocimientos técnicos',
      description: `Con ${analysis.knowledge.correct}/${analysis.knowledge.total} respuestas correctas (${analysis.knowledge.score}%), enfócate en entender mejor los fundamentos de la IA y las mejores prácticas.`,
      priority: 'high',
    });
  }

  if (analysis.adoption.score < 60) {
    recommendations.push({
      title: 'Aumenta tu adopción de IA',
      description: 'Explora más herramientas de IA y busca oportunidades para integrarlas en tu flujo de trabajo diario.',
      priority: 'medium',
    });
  }

  if (highestDimension.score > 70) {
    recommendations.push({
      title: `Aprovecha tu fortaleza en ${highestDimension.dimension}`,
      description: `Tu puntuación de ${highestDimension.score} puntos en ${highestDimension.dimension} es excelente. Considera compartir tu conocimiento o mentorar a otros en esta área.`,
      priority: 'low',
    });
  }

  return recommendations;
}
