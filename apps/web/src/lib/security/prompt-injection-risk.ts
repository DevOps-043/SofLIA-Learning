import { CLONING_RULE, OFF_SCOPE_AUTOMATION_RULE } from './prompt-injection-detector.clone-rule'
import { DETECTION_RULES } from './prompt-injection-detector.rules'
import type { PromptRiskAssessment } from './prompt-injection-detector.types'
import {
  hasCloneIntentSignals,
  hasEducationalActivityContext,
  isDirectCloneOrSecretRequest,
  isEducationalTechnicalReflection,
  normalizeSecurityText,
  unique,
} from './prompt-injection-detector.utils'

export function evaluatePromptInjectionRisk(input: {
  message: string
  contextExcerpt?: string
}) {
  const corpus = [input.message, input.contextExcerpt || '']
    .filter(Boolean)
    .join('\n')
    .slice(0, 12000)
  const normalizedCorpus = normalizeSecurityText(corpus)
  const normalizedMessage = normalizeSecurityText(input.message)
  const educationalReflection =
    (isEducationalTechnicalReflection(normalizedMessage) ||
      hasEducationalActivityContext(normalizedCorpus)) &&
    !isDirectCloneOrSecretRequest(normalizedMessage)

  let score = 0
  const categories: string[] = []
  const reasons: string[] = []

  for (const rule of [...DETECTION_RULES, CLONING_RULE, OFF_SCOPE_AUTOMATION_RULE]) {
    const ruleCorpus =
      educationalReflection && ['cloning', 'internal_systems'].includes(rule.category)
        ? normalizedMessage
        : normalizedCorpus

    if (rule.patterns.some((pattern) => pattern.test(ruleCorpus))) {
      score += rule.weight
      categories.push(rule.category)
      reasons.push(rule.reason)
    }
  }

  if (
    !educationalReflection &&
    !categories.includes('cloning') &&
    hasCloneIntentSignals(normalizedCorpus)
  ) {
    score += 45
    categories.push('cloning')
    reasons.push('Keyword combination suggests cloning or reverse-engineering intent.')
  }

  const uniqueCategories = unique(categories)
  const shouldBlock =
    uniqueCategories.includes('cloning') ||
    uniqueCategories.includes('internal_systems') ||
    uniqueCategories.includes('secret_access') ||
    uniqueCategories.includes('prompt_leak') ||
    score >= 70
  const shouldGuard = !shouldBlock && score >= 30

  return {
    score: Math.min(score, 100),
    action: shouldBlock ? 'block' : shouldGuard ? 'guard' : 'allow',
    categories: uniqueCategories,
    reasons: unique(reasons),
  } satisfies PromptRiskAssessment
}
