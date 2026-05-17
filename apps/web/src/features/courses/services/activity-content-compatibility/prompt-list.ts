export function parsePromptList(rawPrompts: unknown): string[] {
  if (Array.isArray(rawPrompts)) {
    return rawPrompts
      .map((prompt) => String(prompt).trim())
      .filter(Boolean)
  }

  if (typeof rawPrompts !== 'string') {
    return rawPrompts === null || rawPrompts === undefined
      ? []
      : [String(rawPrompts).trim()].filter(Boolean)
  }

  const trimmedPrompts = rawPrompts.trim()
  if (!trimmedPrompts) return []

  try {
    const parsed = JSON.parse(trimmedPrompts)
    if (Array.isArray(parsed)) {
      return parsed
        .map((prompt) => String(prompt).trim())
        .filter(Boolean)
    }
  } catch {
    return trimmedPrompts
      .split('\n')
      .map((prompt) => prompt.trim())
      .filter(Boolean)
  }

  return [trimmedPrompts]
}
