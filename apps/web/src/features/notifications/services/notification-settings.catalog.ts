export const BUSINESS_NOTIFICATION_EVENT_TYPES = [
  'course_assigned',
  'course_completed',
  'certificate_generated',
  'deadline_approaching',
  'learning_daily_summary',
  'progress_milestone',
  'user_added',
] as const

export type BusinessNotificationEventType =
  (typeof BUSINESS_NOTIFICATION_EVENT_TYPES)[number]

export const DEFAULT_BUSINESS_NOTIFICATION_CHANNELS = ['in_app'] as const

const BUSINESS_NOTIFICATION_EVENT_LABELS: Record<
  BusinessNotificationEventType,
  string
> = {
  certificate_generated: 'Certificado generado',
  course_assigned: 'Curso asignado',
  course_completed: 'Curso completado',
  deadline_approaching: 'Fecha limite proxima',
  learning_daily_summary: 'Recordatorio diario',
  progress_milestone: 'Hito de progreso',
  user_added: 'Usuario agregado',
}

const BUSINESS_NOTIFICATION_EVENT_DESCRIPTIONS: Record<
  BusinessNotificationEventType,
  string
> = {
  certificate_generated: 'Notificar cuando se genera un certificado',
  course_assigned: 'Notificar cuando se asigna un curso a un usuario',
  course_completed: 'Notificar cuando un usuario completa un curso',
  deadline_approaching: 'Notificar cuando se acerca la fecha limite de un curso asignado',
  learning_daily_summary: 'Enviar un resumen diario para continuar cursos activos',
  progress_milestone: 'Notificar cuando un usuario alcanza hitos de progreso',
  user_added: 'Notificar cuando se agrega un nuevo usuario a la organizacion',
}

export function buildBusinessNotificationEventOptions() {
  return BUSINESS_NOTIFICATION_EVENT_TYPES.map((eventType) => ({
    description: BUSINESS_NOTIFICATION_EVENT_DESCRIPTIONS[eventType],
    descriptionKey: `business.notifications.events.${eventType}.description`,
    label: BUSINESS_NOTIFICATION_EVENT_LABELS[eventType],
    labelKey: `business.notifications.events.${eventType}.label`,
    value: eventType,
  }))
}
