export function normalizePath(path: string): string {
  let normalized = path.split('?')[0].split('#')[0]

  normalized = normalized.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '{id}',
  )
  normalized = normalized.replace(/\/\d{5,}\//g, '/{id}/')

  return normalized
}

export function buildPageMatchFilter(currentPage: string) {
  const normalizedPath = normalizePath(currentPage)
  return `pathname.ilike.%${normalizedPath}%,pagina_url.ilike.%${normalizedPath}%`
}

export function emptyBugStats() {
  return { total: 0, open: 0, resolved: 0, byCategory: {} }
}
