// ============================================
// ORQUESTADOR DEL PROMPT DE SISTEMA DE SofLIA
// Importa sub-modulos y reexporta la misma API publica.
// ============================================

import {
  GLOBAL_UI_CONTEXT,
  LIA_BUG_REPORT_CONFIRMATION_OVERRIDE,
  LIA_SYSTEM_PROMPT,
} from './prompt-base.service';
import { buildUserContextSection } from './prompt-context.service';
import {
  buildBusinessRoutesSection,
  buildPageInstructionsSection,
} from './prompt-instructions.service';
import type { PlatformContext } from './platform-context.service';

export { LIA_SYSTEM_PROMPT } from './prompt-base.service';

export function getLIASystemPrompt(context?: PlatformContext): string {
  let prompt = context
    ? buildBusinessRoutesSection(context, LIA_SYSTEM_PROMPT)
    : LIA_SYSTEM_PROMPT;

  prompt += LIA_BUG_REPORT_CONFIRMATION_OVERRIDE;

  const orgSlug = context?.organizationSlug || '';
  const orgPrefix = orgSlug ? `/${orgSlug}` : '';

  let globalContext = GLOBAL_UI_CONTEXT;
  if (orgSlug) {
    globalContext = globalContext
      .replace(/\(\/business-panel\//g, `(${orgPrefix}/business-panel/`)
      .replace(/\(\/business-user\//g, `(${orgPrefix}/business-user/`)
      .replace(
        /Ruta base: \/business-panel/g,
        `Ruta base: ${orgPrefix}/business-panel`,
      )
      .replace(
        /Ruta base: \/business-user/g,
        `Ruta base: ${orgPrefix}/business-user`,
      );
  }
  prompt += '\n' + globalContext + '\n';

  if (context) {
    prompt += '\n\n## Contexto Actual de SOFLIA\n';
    prompt += buildPageInstructionsSection(context);
    prompt +=
      'Usa esta informacion verificada de la plataforma solo para personalizar y contextualizar tus respuestas. Nunca expongas detalles tecnicos internos ni su origen.\n';
    prompt += buildUserContextSection(context);
  }

  return prompt;
}
