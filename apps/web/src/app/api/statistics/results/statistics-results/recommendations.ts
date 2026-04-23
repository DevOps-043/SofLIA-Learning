import { AnalysisSummary, RadarDimensionScore, RecommendationItem } from './types'

export function generateRecommendations(
  radarData: RadarDimensionScore[],
  analysis: AnalysisSummary,
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = []
  const lowestDimension = radarData.reduce((min, current) => (current.score < min.score ? current : min))
  const highestDimension = radarData.reduce((max, current) => (current.score > max.score ? current : max))

  if (lowestDimension.score < 40) {
    recommendations.push({
      title: `Mejora en: ${lowestDimension.dimension}`,
      description: `Tu puntuacion en ${lowestDimension.dimension} es de ${lowestDimension.score} puntos. Enfocate en desarrollar esta area para equilibrar tu perfil de competencias.`,
      priority: 'high',
    })
  }
  if (analysis.knowledge.score < 50) {
    recommendations.push({
      title: 'Profundiza tus conocimientos tecnicos',
      description: `Con ${analysis.knowledge.correct}/${analysis.knowledge.total} respuestas correctas (${analysis.knowledge.score}%), enfocate en entender mejor los fundamentos de la IA y las mejores practicas.`,
      priority: 'high',
    })
  }
  if (analysis.adoption.score < 60) {
    recommendations.push({
      title: 'Aumenta tu adopcion de IA',
      description: 'Explora mas herramientas de IA y busca oportunidades para integrarlas en tu flujo de trabajo diario.',
      priority: 'medium',
    })
  }
  if (highestDimension.score > 70) {
    recommendations.push({
      title: `Aprovecha tu fortaleza en ${highestDimension.dimension}`,
      description: `Tu puntuacion de ${highestDimension.score} puntos en ${highestDimension.dimension} es excelente. Considera compartir tu conocimiento o mentorar a otros en esta area.`,
      priority: 'low',
    })
  }

  return recommendations
}
