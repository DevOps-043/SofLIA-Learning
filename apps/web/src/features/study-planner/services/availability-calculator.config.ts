type SessionType = 'short' | 'medium' | 'long'

export interface RoleAvailabilityConfig {
  dailyMinutesMin: number
  dailyMinutesMax: number
  weeklyHoursMin: number
  weeklyHoursMax: number
  recommendedSessionType: SessionType
}

export const AVAILABILITY_BY_LEVEL: Record<string, RoleAvailabilityConfig> = {
  'c-level': { dailyMinutesMin: 15, dailyMinutesMax: 30, weeklyHoursMin: 1, weeklyHoursMax: 2, recommendedSessionType: 'short' },
  gerencia: { dailyMinutesMin: 30, dailyMinutesMax: 45, weeklyHoursMin: 2, weeklyHoursMax: 3, recommendedSessionType: 'short' },
  senior: { dailyMinutesMin: 45, dailyMinutesMax: 60, weeklyHoursMin: 3, weeklyHoursMax: 4, recommendedSessionType: 'medium' },
  profesional: { dailyMinutesMin: 45, dailyMinutesMax: 60, weeklyHoursMin: 3, weeklyHoursMax: 5, recommendedSessionType: 'medium' },
  junior: { dailyMinutesMin: 60, dailyMinutesMax: 90, weeklyHoursMin: 5, weeklyHoursMax: 7, recommendedSessionType: 'long' },
  default: { dailyMinutesMin: 45, dailyMinutesMax: 60, weeklyHoursMin: 3, weeklyHoursMax: 5, recommendedSessionType: 'medium' },
}

export const COMPANY_SIZE_MULTIPLIERS: Record<string, number> = {
  micro: 1.2,
  pequeña: 1.0,
  pequena: 1.0,
  mediana: 0.9,
  grande: 0.8,
  corporativa: 0.7,
}

export const AREA_MULTIPLIERS: Record<string, number> = {
  tecnología: 1.1,
  tecnologia: 1.1,
  it: 1.1,
  desarrollo: 1.1,
  ingeniería: 1.1,
  ingenieria: 1.1,
  ventas: 0.85,
  comercial: 0.85,
  marketing: 0.95,
  'recursos humanos': 1.0,
  rrhh: 1.0,
  finanzas: 0.95,
  operaciones: 0.9,
  legal: 0.9,
  default: 1.0,
}

export const C_LEVEL_PATTERNS = [
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cio', 'chief',
  'director general', 'presidente', 'fundador', 'founder',
  'owner', 'dueño', 'dueno', 'propietario', 'socio',
]

export const MANAGEMENT_PATTERNS = [
  'gerente', 'manager', 'director', 'jefe', 'head', 'lead',
  'supervisor', 'coordinador', 'líder', 'lider', 'responsable',
]

export const SENIOR_PATTERNS = [
  'senior', 'sr', 'especialista', 'expert', 'consultant',
  'consultor', 'arquitecto', 'principal',
]
