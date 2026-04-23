import { BugReportConfirmationIntent } from './types';

export function detectBugReportConfirmationIntent(
  message: string
): BugReportConfirmationIntent {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) return 'unclear';

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
  ];

  if (revisePatterns.some((pattern) => pattern.test(normalizedMessage))) {
    return 'revise';
  }

  const confirmPatterns = [
    /^s[iÃ­]\b/,
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
    /^env[iÃ­]alo\b/,
    /^mand[aÃ¡]lo\b/,
    /^qued[oÃ³] bien\b/,
    /^as[iÃ­] est[aÃ¡] bien\b/,
    /^est[aÃ¡] correcto\b/,
  ];

  return confirmPatterns.some((pattern) => pattern.test(normalizedMessage))
    ? 'confirm'
    : 'unclear';
}
