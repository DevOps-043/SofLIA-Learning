import {
  detectMessageLanguage,
  normalizeLanguage,
  type SupportedLanguage,
} from './language-detection.service'

export function resolveRequestLanguage(
  message: string,
  languageFromRequest: string,
): SupportedLanguage {
  const detectedMessageLanguage = detectMessageLanguage(message)

  if (languageFromRequest && languageFromRequest !== 'es') {
    return normalizeLanguage(languageFromRequest)
  }

  if (
    detectedMessageLanguage !== 'es' &&
    detectedMessageLanguage !== languageFromRequest
  ) {
    return detectedMessageLanguage
  }

  return normalizeLanguage(languageFromRequest || 'es')
}
