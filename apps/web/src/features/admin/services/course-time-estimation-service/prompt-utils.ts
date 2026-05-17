export function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) {
    return []
  }

  try {
    const parsed = JSON.parse(rawPrompts) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map((prompt) => String(prompt).trim()).filter(Boolean)
    }
  } catch {
    // Fallback to plain text prompts.
  }

  return rawPrompts
    .split('\n')
    .map((prompt) => prompt.trim())
    .filter(Boolean)
}
