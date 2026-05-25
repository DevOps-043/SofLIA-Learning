import {
  CLONE_ASSET_KEYWORDS,
  CLONE_INTENT_KEYWORDS,
  CLONE_TARGET_KEYWORDS,
} from './prompt-injection-detector.clone-signals'
import { CLONING_RULE } from './prompt-injection-detector.clone-rule'
import { DETECTION_RULES } from './prompt-injection-detector.rules'

export function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export function normalizeSecurityText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function hasCloneIntentSignals(corpus: string) {
  const intentHits = collectKeywordHits(corpus, CLONE_INTENT_KEYWORDS)
  const assetHits = collectKeywordHits(corpus, CLONE_ASSET_KEYWORDS)
  const targetHits = collectKeywordHits(corpus, CLONE_TARGET_KEYWORDS)

  return (
    (intentHits.length >= 1 && assetHits.length >= 2) ||
    (intentHits.length >= 1 && assetHits.length >= 1 && targetHits.length >= 1) ||
    (assetHits.length >= 3 && targetHits.length >= 1)
  )
}

export function isEducationalTechnicalReflection(corpus: string) {
  const learningContext =
    /\b(actividad|leccion|curso|taller|aprendizaje|comunicacion asertiva|refactorizacion|desarrollador web|companeros|equipo)\b/i.test(
      corpus,
    )
  const consequenceLanguage =
    /\b(impacto|riesgo|latencia|errores|usuarios|mantenibilidad|calidad|soportar|servicio|codigo actual|seguir adelante)\b/i.test(
      corpus,
    )

  return learningContext && consequenceLanguage
}

export function hasEducationalActivityContext(corpus: string) {
  return /\b(actividad|leccion|curso|taller|aprendizaje|comunicacion asertiva|refactorizacion|desarrollador web|companeros|equipo)\b/i.test(
    corpus,
  )
}

export function isDirectCloneOrSecretRequest(corpus: string) {
  return [...DETECTION_RULES, CLONING_RULE].some((rule) => {
    if (!['cloning', 'prompt_leak', 'secret_access', 'internal_systems'].includes(rule.category)) {
      return false
    }

    return rule.patterns.some((pattern) => pattern.test(corpus))
  })
}

function collectKeywordHits(corpus: string, keywords: string[]) {
  return keywords.filter((keyword) => corpus.includes(keyword))
}
