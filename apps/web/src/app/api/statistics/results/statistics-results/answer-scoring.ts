import { StatisticsResponseRow } from './types'

export function parseStoredValue(value: unknown) {
  if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

export function calculateResponseScore(response: StatisticsResponseRow) {
  const value = parseStoredValue(response.valor)
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0

  const scale = response.preguntas?.escala
  if (scale && typeof scale === 'object') {
    return scale[value] || 0
  }

  if (value.includes('A)')) return 0
  if (value.includes('B)')) return 25
  if (value.includes('C)')) return 50
  if (value.includes('D)')) return 75
  if (value.includes('E)')) return 100
  return 50
}

export function isCorrectKnowledgeAnswer(response: StatisticsResponseRow) {
  return parseStoredValue(response.valor) === response.preguntas?.respuesta_correcta
}
