export function formatAdminUserDate(value: string | null | undefined, language: string) {
  if (!value) return null

  return new Date(value).toLocaleDateString(
    language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US',
    { day: '2-digit', month: 'short', year: 'numeric' },
  )
}
