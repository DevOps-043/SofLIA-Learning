import type { BugReportConfirmationIntent } from './types'

export function detectBugReportConfirmationIntent(message: string): BugReportConfirmationIntent {
  const normalizedMessage = message.trim().toLowerCase()

  if (!normalizedMessage) return 'unclear'

  const revisePatterns = [
    /\bpero\b/,
    /^no\b/,
    /\bcorrige\b/,
    /\bajusta\b/,
    /\bcambia\b/,
    /\bmodifica\b/,
    /\bagrega\b/,
    /\bquita\b/,
    /\bfalta\b/,
    /\breformula\b/,
    /\bno exactamente\b/,
    /\bno del todo\b/,
    /\bmejor\b/,
  ]

  if (revisePatterns.some(pattern => pattern.test(normalizedMessage))) {
    return 'revise'
  }

  const confirmPatterns = [
    /^s[ií]\b/,
    /^yes\b/,
    /^ok\b/,
    /^okay\b/,
    /^vale\b/,
    /^va\b/,
    /^dale\b/,
    /^de acuerdo\b/,
    /^correcto\b/,
    /^confirmo\b/,
    /^procede\b/,
    /^adelante\b/,
    /^env[ií]alo\b/,
    /^mand[aá]lo\b/,
    /^qued[oó] bien\b/,
    /^as[ií] est[aá] bien\b/,
    /^est[aá] correcto\b/,
  ]

  return confirmPatterns.some(pattern => pattern.test(normalizedMessage))
    ? 'confirm'
    : 'unclear'
}
