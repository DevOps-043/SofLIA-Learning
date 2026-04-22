const orderedDayNames = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
]

function normalizePreferenceText(message: string): string {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function detectPlannerDays(message: string): string[] {
  const normalizedMsg = normalizePreferenceText(message)
  const rangeMatch = normalizedMsg.match(
    /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:a|al|hasta)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/i,
  )

  if (rangeMatch) {
    const startIdx = orderedDayNames.indexOf(rangeMatch[1].toLowerCase())
    const endIdx = orderedDayNames.indexOf(rangeMatch[2].toLowerCase())
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      return orderedDayNames.slice(startIdx, endIdx + 1)
    }
  }

  const matches = normalizedMsg.match(
    /lunes|lune|lun|martes|mar|miercoles|mier|jueves|jue|viernes|vier|vie|sabado|sab|domingo|dom/gi,
  )
  if (!matches) return []

  const normalizationMap: Record<string, string> = {
    lun: 'lunes',
    lune: 'lunes',
    lunes: 'lunes',
    mar: 'martes',
    martes: 'martes',
    mier: 'miercoles',
    miercoles: 'miercoles',
    jueves: 'jueves',
    jue: 'jueves',
    vie: 'viernes',
    vier: 'viernes',
    viernes: 'viernes',
    sab: 'sabado',
    sabado: 'sabado',
    dom: 'domingo',
    domingo: 'domingo',
  }

  return [
    ...new Set(
      matches
        .map((day) => normalizePreferenceText(day))
        .map((day) => normalizationMap[day] || day),
    ),
  ]
}

export function detectPlannerTimes(message: string): string[] {
  const normalizedMsg = normalizePreferenceText(message)

  if (
    normalizedMsg.includes('horario laboral')
    || normalizedMsg.includes('jornada laboral')
    || normalizedMsg.includes('horario de trabajo')
    || normalizedMsg.includes('horas laborales')
  ) {
    return ['manana', 'tarde']
  }

  const matches = normalizedMsg.match(/manana|tarde|noche/gi)
  return matches ? [...new Set(matches.map((value) => normalizePreferenceText(value)))] : ['manana']
}

export function detectExplicitSessionDuration(message: string): number | null {
  const normalizedMsg = normalizePreferenceText(message)
  const hoursMatch = normalizedMsg.match(/(\d+(?:\.\d+)?)\s*(?:hora|horas|hr|hrs)/i)
  if (hoursMatch) {
    return Math.round(parseFloat(hoursMatch[1]) * 60)
  }

  const minutesMatch = normalizedMsg.match(/(\d+)\s*(?:minuto|minutos|min|mins)/i)
  return minutesMatch ? parseInt(minutesMatch[1], 10) : null
}
