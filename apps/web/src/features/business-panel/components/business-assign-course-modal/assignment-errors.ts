export interface CourseAssignmentErrorPayload {
  error?: string
  message?: string
}

export function getCourseAssignmentErrorMessage(
  payload: CourseAssignmentErrorPayload,
  fallback: string,
): string {
  if (payload.message?.trim() && !/^[A-Z][A-Z0-9_]+$/.test(payload.message.trim())) {
    return payload.message
  }
  if (payload.error === 'COURSE_ALREADY_ASSIGNED') {
    return 'El curso ya está asignado a los usuarios seleccionados. Para quitar una asignación directa, haz clic en «Clic para quitar» junto al usuario y confirma los cambios.'
  }
  if (payload.error?.trim() && !/^[A-Z][A-Z0-9_]+$/.test(payload.error.trim())) {
    return payload.error
  }
  return fallback
}
