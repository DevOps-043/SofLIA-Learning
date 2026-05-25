import { JSON_LIKE_PATTERN } from './constants'
import { hasMeaningfulStringContent } from './html'

export function isDisplayablePlainString(value: string): boolean {
  const trimmed = value.trim()
  return hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)
}
