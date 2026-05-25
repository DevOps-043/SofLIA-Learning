export function normalizePlannerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function includesAny(
  normalizedValue: string,
  tokens: readonly string[],
): boolean {
  return tokens.some((token) => normalizedValue.includes(token))
}

export function sanitizeHolidayMentions(value: string): string {
  let next = value

  next = next.replace(/^\*?\s*jueves\s+1\s*:?.*$/gim, '')
  next = next.replace(/\*\s*08:00.*jueves\s+1.*\n?/gi, '')
  next = next.replace(/fechas:\s*1\s+de\s+enero/gi, 'Fechas: 2 de enero')
  next = next.replace(/1\s+de\s+enero\s*[-â€“]\s*(\d+\s+de\s+enero)/gi, '2 de enero - $1')
  next = next.replace(/\n{3,}/g, '\n\n')

  return next.trim()
}

export function buildLoopEscapeInstruction(message: string): string {
  return `${message}\n\n[SISTEMA: Se detecto un posible bucle en la conversacion. ` +
    'En lugar de volver a preguntar lo mismo, propone opciones concretas y validadas para destrabar el plan. ' +
    'No vuelvas a pedir que el usuario confirme los mismos dias u horarios.]'
}
