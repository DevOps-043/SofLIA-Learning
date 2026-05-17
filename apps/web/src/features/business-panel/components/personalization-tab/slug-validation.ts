export function validateOrganizationSlug(value: string): string | null {
  if (!value) return 'El identificador es requerido'
  if (value.length < 3) return 'Minimo 3 caracteres'
  if (value.length > 50) return 'Maximo 50 caracteres'
  if (!/^[a-z0-9-]+$/.test(value)) return 'Solo letras minusculas, numeros y guiones'
  if (value.startsWith('-') || value.endsWith('-')) return 'No puede empezar o terminar con guion'
  return null
}

export function normalizeSlugInput(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
}
