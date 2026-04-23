import { StatisticsResponseRow } from './types'

export function matchesDimension(response: StatisticsResponseRow, dimension: string) {
  const questionDimensions = response.preguntas?.dimension
  if (questionDimensions && Array.isArray(questionDimensions)) {
    return questionDimensions.includes(dimension)
  }

  const section = normalizeComparableText(response.preguntas?.section)
  const bloque = normalizeComparableText(response.preguntas?.bloque)
  if (section === 'adopcion' || bloque === 'adopcion') return dimension === 'Aplicacion'
  if (section === 'conocimiento' || bloque === 'conocimiento' || bloque === 'tecnico') {
    return dimension === 'Conocimiento'
  }
  if (section !== 'cuestionario') return false

  const questionText = normalizeComparableText(response.preguntas?.texto)
  if (questionText.includes('productividad') || questionText.includes('eficiencia')) return dimension === 'Productividad'
  if (questionText.includes('estrategia') || questionText.includes('planificacion')) return dimension === 'Estrategia'
  if (questionText.includes('inversion') || questionText.includes('presupuesto')) return dimension === 'Inversion'
  return dimension === 'Aplicacion'
}

function normalizeComparableText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
