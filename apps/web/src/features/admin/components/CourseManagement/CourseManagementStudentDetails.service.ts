import type {
  CourseStudentStudySessions,
  EnrollmentStatus,
  StudentActiveDayPoint,
  StudentConversationTopic,
  StudentConversationWeek,
  StudentDailyStudyTimePoint,
  StudentPreferredTimeSlot,
  StudentWeeklyProgressPoint,
} from './types'

export const DEFAULT_WEEKLY_PROGRESS: StudentWeeklyProgressPoint[] = [
  { dia: 'Lun', progreso: 0 },
  { dia: 'Mar', progreso: 0 },
  { dia: 'Mie', progreso: 0 },
  { dia: 'Jue', progreso: 0 },
  { dia: 'Vie', progreso: 0 },
  { dia: 'Sab', progreso: 0 },
  { dia: 'Dom', progreso: 0 },
]

export const DEFAULT_DAILY_STUDY_TIME: StudentDailyStudyTimePoint[] = [
  { dia: 'Lun', horas: 0 },
  { dia: 'Mar', horas: 0 },
  { dia: 'Mie', horas: 0 },
  { dia: 'Jue', horas: 0 },
  { dia: 'Vie', horas: 0 },
  { dia: 'Sab', horas: 0 },
  { dia: 'Dom', horas: 0 },
]

export const DEFAULT_PREFERRED_TIME_SLOTS: StudentPreferredTimeSlot[] = [
  { periodo: 'Manana (6am-12pm)', porcentaje: 0, color: '#F59E0B' },
  { periodo: 'Tarde (12pm-6pm)', porcentaje: 0, color: '#00D4B3' },
  { periodo: 'Noche (6pm-12am)', porcentaje: 0, color: '#10B981' },
  { periodo: 'Madrugada (12am-6am)', porcentaje: 0, color: '#6C757D' },
]

export const DEFAULT_ACTIVE_DAYS: StudentActiveDayPoint[] = [
  { dia: 'L', sesiones: 0 },
  { dia: 'M', sesiones: 0 },
  { dia: 'X', sesiones: 0 },
  { dia: 'J', sesiones: 0 },
  { dia: 'V', sesiones: 0 },
  { dia: 'S', sesiones: 0 },
  { dia: 'D', sesiones: 0 },
]

export const DEFAULT_CONVERSATIONS_BY_WEEK: StudentConversationWeek[] = [
  { week: 'S1', count: 0 },
  { week: 'S2', count: 0 },
  { week: 'S3', count: 0 },
  { week: 'S4', count: 0 },
  { week: 'S5', count: 0 },
]

export const DEFAULT_CONVERSATION_TOPICS: StudentConversationTopic[] = [
  { tema: 'Dudas de Lecciones', count: 0, color: '#0A2540' },
  { tema: 'Ayuda con Actividades', count: 0, color: '#00D4B3' },
  { tema: 'Explicaciones Extra', count: 0, color: '#10B981' },
  { tema: 'Motivacion', count: 0, color: '#F59E0B' },
]

export function getCourseManagementEnrollmentStatusLabel(
  status: EnrollmentStatus | null | undefined,
): string {
  switch (status) {
    case 'completed':
      return 'Completado'
    case 'active':
      return 'Activo'
    case 'paused':
      return 'Pausado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Desconocido'
  }
}

export function getCourseManagementEnrollmentStatusTone(
  status: EnrollmentStatus | null | undefined,
): string {
  switch (status) {
    case 'completed':
      return 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
    case 'active':
      return 'bg-[#00D4B3]/10 text-[#00D4B3] border border-[#00D4B3]/30'
    default:
      return 'bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/30'
  }
}

export function getCourseManagementEnrollmentStatusDotTone(
  status: EnrollmentStatus | null | undefined,
): string {
  switch (status) {
    case 'completed':
      return 'bg-[#10B981]'
    case 'active':
      return 'bg-[#00D4B3] animate-pulse'
    default:
      return 'bg-[#6C757D]'
  }
}

export function getDominantStudyPeriod(
  preferredTimeSlots: StudentPreferredTimeSlot[] | null | undefined,
): string | null {
  if (!preferredTimeSlots || preferredTimeSlots.length === 0) {
    return null
  }

  const dominantSlot = preferredTimeSlots.reduce((current, candidate) =>
    candidate.porcentaje > current.porcentaje ? candidate : current,
  )

  return dominantSlot.periodo.toLowerCase()
}

export function buildCourseManagementStudentInsight(
  studySessions: CourseStudentStudySessions | null | undefined,
): string {
  if (!studySessions) {
    return 'Aun no hay suficientes datos para generar insights personalizados.'
  }

  const dominantPeriod = getDominantStudyPeriod(studySessions.preferredTimeSlots)

  if (!dominantPeriod) {
    return 'Aun no hay suficientes datos para generar insights personalizados.'
  }

  const streak =
    studySessions.studyStreak > 0
      ? ` Racha actual: ${studySessions.studyStreak} dias consecutivos.`
      : ''

  return `Este estudiante muestra un patron de estudio ${dominantPeriod}. Frecuencia semanal: ${studySessions.weeklyFrequency} dias. Duracion promedio: ${studySessions.avgSessionDuration} minutos por sesion.${streak}`
}
