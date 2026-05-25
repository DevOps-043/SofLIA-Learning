const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  return SLUG_PATTERN.test(slug) && slug.length >= 3 && slug.length <= 100
}
