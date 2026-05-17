import { parseJsonIfPossible } from './json'

export function extractPromptList(rawPrompts: unknown): string[] {
  const parsedPrompts = parseJsonIfPossible(rawPrompts)

  const promptList = Array.isArray(parsedPrompts)
    ? parsedPrompts
    : parsedPrompts === undefined || parsedPrompts === null
      ? []
      : [parsedPrompts]

  return promptList
    .filter((prompt) => prompt !== null && prompt !== undefined)
    .map((prompt) => String(prompt).replace(/^["']|["']$/g, '').trim())
    .filter(Boolean)
}
