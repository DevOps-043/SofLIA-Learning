export function normalizeCalendarMutationError(errorMessage?: string): string {
  const fallbackMessage = errorMessage || 'Error al guardar el evento'

  if (
    fallbackMessage.includes('insufficient authentication scopes') ||
    (
      fallbackMessage.includes('insufficient') &&
      fallbackMessage.includes('scopes')
    )
  ) {
    return 'Permisos insuficientes. Por favor, reconecta tu calendario de Google con permisos de escritura.'
  }

  return fallbackMessage
}
