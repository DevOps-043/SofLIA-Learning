export function getAdoptionDescription(score: number) {
  if (score >= 80) {
    return 'Excelente nivel de adopción de IA. Has integrado herramientas de IA de manera efectiva en múltiples áreas de tu trabajo.';
  }
  if (score >= 60) {
    return 'Buen nivel de adopción de IA. Has comenzado a integrar herramientas de IA en algunos aspectos de tu trabajo.';
  }
  if (score >= 40) {
    return 'Nivel medio de adopción de IA. Estás explorando algunas herramientas de IA en tu trabajo diario.';
  }
  if (score >= 20) {
    return 'Nivel básico de adopción de IA. Has comenzado a experimentar con algunas herramientas de IA.';
  }
  return 'Nivel principiante de adopción de IA. Hay muchas oportunidades para comenzar a integrar IA en tu trabajo.';
}

export function getKnowledgeDescription(score: number, correct: number, total: number) {
  if (score >= 80) {
    return `Excelente comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  }
  if (score >= 60) {
    return `Buena comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  }
  if (score >= 40) {
    return `Comprensión media de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  }
  if (score >= 20) {
    return `Comprensión básica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  }

  return `Comprensión principiante de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%). Hay oportunidades significativas para expandir tu entendimiento técnico.`;
}
