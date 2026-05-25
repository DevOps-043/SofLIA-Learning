export function addUniqueNoteTag(tags: string[], rawTag: string): string[] {
  const normalizedTag = rawTag.trim()

  if (!normalizedTag || tags.includes(normalizedTag)) {
    return tags
  }

  return [...tags, normalizedTag]
}

export function removeNoteTag(tags: string[], tagToRemove: string): string[] {
  return tags.filter((tag) => tag !== tagToRemove)
}

export function hasNoteContent(content: string): boolean {
  return content.trim().length > 0
}
