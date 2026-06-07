interface ValidationDetails {
  fieldErrors?: Record<string, string[] | undefined>
  formErrors?: string[]
}

interface AdminApiErrorPayload {
  details?: ValidationDetails | null
  error?: string
  message?: string
}

export function getAdminApiErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const errorPayload = payload as AdminApiErrorPayload
  const detailMessages = getValidationMessages(errorPayload.details)
  const baseMessage = errorPayload.message || errorPayload.error || fallback

  return detailMessages.length > 0
    ? `${baseMessage}: ${detailMessages.join('; ')}`
    : baseMessage
}

function getValidationMessages(details?: ValidationDetails | null): string[] {
  if (!details) return []

  const fieldMessages = Object.entries(details.fieldErrors || {}).flatMap(
    ([field, messages]) => (messages || []).map((message) => `${field}: ${message}`),
  )

  return [...(details.formErrors || []), ...fieldMessages]
}
