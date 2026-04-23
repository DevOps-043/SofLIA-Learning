export function resolveCourseSlug(title: string, explicitSlug?: string) {
  if (explicitSlug) return explicitSlug

  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${normalizedTitle}-${Date.now().toString().slice(-4)}`
}
