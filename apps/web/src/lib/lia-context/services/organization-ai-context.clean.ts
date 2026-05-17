export function cleanPromptValue(value: string | undefined, maxLength = 500) {
  if (!value) {
    return undefined
  }

  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

export function cleanOptional(
  value: string | null | undefined,
  maxLength?: number,
) {
  return cleanPromptValue(value || undefined, maxLength)
}
