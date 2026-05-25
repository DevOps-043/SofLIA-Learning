export function cleanPromptValue(value: string | undefined, maxLength = 500) {
  if (!value) {
    return undefined
  }

  const cleaned = Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0)
      return code <= 0x1f || code === 0x7f ? ' ' : char
    })
    .join('')
    .trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

export function cleanOptional(
  value: string | null | undefined,
  maxLength?: number,
) {
  return cleanPromptValue(value || undefined, maxLength)
}
