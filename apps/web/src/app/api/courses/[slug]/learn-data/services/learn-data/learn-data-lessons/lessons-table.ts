import {
  getLessonsTableNameForLanguage,
  normalizeLearnLanguage,
} from '../../../../../_services/lesson-language-resolution.service'

export function getLessonsTableName(language: string) {
  return getLessonsTableNameForLanguage(normalizeLearnLanguage(language))
}
