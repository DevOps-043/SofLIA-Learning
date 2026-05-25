export const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

export const MONTH_ABBREVIATIONS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

export const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export const MONTH_PATTERN = `${MONTH_NAMES.join('|')}|${MONTH_ABBREVIATIONS.join('|')}`
export const DAY_PATTERN = 'lunes|martes|miercoles|jueves|viernes|sabado|domingo'
export const LESSON_LIST_BULLET_PATTERN = '(?:[-*\\u2022]\\s*)?'
