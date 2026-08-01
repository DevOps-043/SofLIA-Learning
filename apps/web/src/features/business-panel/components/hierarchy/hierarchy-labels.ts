type HierarchyLabelTranslator = (key: string, options?: Record<string, unknown>) => string

function humanizeHierarchyType(value: string) {
  const words = value.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').split(' ')

  return words.map(word => {
    if (!word) return word
    if (word.length > 1 && word === word.toUpperCase()) return word
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`
  }).join(' ')
}

/**
 * Resolves built-in hierarchy types through i18n and keeps custom database
 * values human-readable instead of exposing a missing translation key.
 */
export function getHierarchyTypeLabel(type: string | null | undefined, t: HierarchyLabelTranslator) {
  const rawType = type?.trim()
  if (!rawType) return t('hierarchy.nodeForm.types.custom')

  const normalizedType = rawType.toLocaleLowerCase().replace(/[\s-]+/g, '_')
  if (normalizedType === 'custom') return t('hierarchy.nodeForm.types.custom')

  return t(`hierarchy.types.${normalizedType}`, {
    defaultValue: humanizeHierarchyType(rawType),
  })
}
