import type { LearningPathTranslator } from './types'

export function formatTranslation(
  t: LearningPathTranslator,
  key: string,
  defaultValue: string,
  replacements: Record<string, string | number>,
) {
  let text = t(key, defaultValue)

  for (const [name, value] of Object.entries(replacements)) {
    text = text.split(`{{${name}}}`).join(String(value))
  }

  return text
}
