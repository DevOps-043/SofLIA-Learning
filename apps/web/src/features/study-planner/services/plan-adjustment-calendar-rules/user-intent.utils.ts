import { userExplicitlyAllowsSunday } from '../sunday-eligibility.service'

export function normalizeDayIdentifier(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function userExplicitlyAllowsOutsideWorkBlocks(message: string): boolean {
  const normalized = normalizeDayIdentifier(message || '')

  if (normalized.includes('domingo')) {
    return userExplicitlyAllowsSunday(message)
  }

  return [
    'sabado',
    'tiempo libre',
    'fuera del trabajo',
    'fuera de trabajo',
    'fuera del horario laboral',
    'fuera de horario laboral',
    'aunque no trabaje',
    'aunque no haya trabajo',
    'aunque sea descanso',
    'aunque sea mi descanso',
    'en mi descanso',
    'dia de descanso',
    'fin de semana',
    'aunque sea sabado',
    'usa mi sabado',
  ].some((signal) => normalized.includes(signal))
}
