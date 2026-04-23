export function getLevel(score: number) {
  if (score >= 80) return 'Avanzado'
  if (score >= 60) return 'Intermedio'
  if (score >= 40) return 'Medio'
  if (score >= 20) return 'Basico'
  return 'Principiante'
}

export function getAdoptionDescription(score: number) {
  if (score >= 80) return 'Excelente nivel de adopcion de IA. Has integrado herramientas de IA de manera efectiva en multiples areas de tu trabajo.'
  if (score >= 60) return 'Buen nivel de adopcion de IA. Has comenzado a integrar herramientas de IA en algunos aspectos de tu trabajo.'
  if (score >= 40) return 'Nivel medio de adopcion de IA. Estas explorando algunas herramientas de IA en tu trabajo diario.'
  if (score >= 20) return 'Nivel basico de adopcion de IA. Has comenzado a experimentar con algunas herramientas de IA.'
  return 'Nivel principiante de adopcion de IA. Hay muchas oportunidades para comenzar a integrar IA en tu trabajo.'
}

export function getKnowledgeDescription(score: number, correct: number, total: number) {
  if (score >= 80) return `Excelente comprension tecnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`
  if (score >= 60) return `Buena comprension tecnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`
  if (score >= 40) return `Comprension media de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`
  if (score >= 20) return `Comprension basica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`
  return `Comprension principiante de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%). Hay oportunidades significativas para expandir tu entendimiento tecnico.`
}
