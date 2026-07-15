import type {
  EnrollmentStatus,
  StudentConversationTopic,
  StudentConversationWeek,
} from './types'

export const DEFAULT_CONVERSATIONS_BY_WEEK: StudentConversationWeek[] = [
  { week: 'S1', count: 0 },
  { week: 'S2', count: 0 },
  { week: 'S3', count: 0 },
  { week: 'S4', count: 0 },
  { week: 'S5', count: 0 },
]

export const DEFAULT_CONVERSATION_TOPICS: StudentConversationTopic[] = [
  { tema: 'Dudas de Lecciones', count: 0, color: 'var(--color-primary)' },
  { tema: 'Ayuda con Actividades', count: 0, color: 'var(--color-accent)' },
  { tema: 'Explicaciones Extra', count: 0, color: 'var(--color-success)' },
  { tema: 'Motivación', count: 0, color: 'var(--color-warning)' },
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
      return 'bg-success/10 text-success border border-success/30'
    case 'active':
      return 'bg-accent/10 text-accent border border-accent/30'
    default:
      return 'bg-gray-500/10 text-gray-500 border border-gray-500/30'
  }
}

export function getCourseManagementEnrollmentStatusDotTone(
  status: EnrollmentStatus | null | undefined,
): string {
  switch (status) {
    case 'completed':
      return 'bg-success'
    case 'active':
      return 'bg-accent animate-pulse'
    default:
      return 'bg-gray-500'
  }
}

