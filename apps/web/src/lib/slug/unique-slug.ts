import { sanitizeSlug } from './sanitize-slug'

function fallbackSlug() {
  return `item-${Date.now()}`
}

export function generateUniqueSlug(
  baseName: string,
  existingSlugs: string[] = [],
): string {
  const slug = sanitizeSlug(baseName) || fallbackSlug()

  if (!existingSlugs.includes(slug)) {
    return slug
  }

  for (let counter = 1; counter <= 1000; counter += 1) {
    const uniqueSlug = `${slug}-${counter}`
    if (!existingSlugs.includes(uniqueSlug)) {
      return uniqueSlug
    }
  }

  return `${slug}-${Date.now()}`
}

export async function generateUniqueSlugAsync(
  baseName: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const slug = sanitizeSlug(baseName) || fallbackSlug()

  if (!(await checkExists(slug))) {
    return slug
  }

  for (let counter = 1; counter <= 1000; counter += 1) {
    const uniqueSlug = `${slug}-${counter}`
    if (!(await checkExists(uniqueSlug))) {
      return uniqueSlug
    }
  }

  return `${slug}-${Date.now()}`
}
