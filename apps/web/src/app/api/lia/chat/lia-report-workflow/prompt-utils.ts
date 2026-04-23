import { CONFIRMATION_REMINDER } from './constants';

export function ensureConfirmationPrompt(content: string): string {
  const alreadyRequestsConfirmation =
    /confirmas|esta correcto|estÃ¡ correcto|quieres que lo envie|quieres que lo envÃ­e|puedo enviarlo|puedo enviarlo/i.test(
      content
    );

  if (!content.trim()) return CONFIRMATION_REMINDER;
  if (alreadyRequestsConfirmation) return content.trim();
  return `${content.trim()}\n\n${CONFIRMATION_REMINDER}`;
}
