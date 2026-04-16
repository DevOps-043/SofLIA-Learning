// ============================================
// ORQUESTADOR DEL PROMPT DE SISTEMA DE SofLIA
// Importa sub-módulos y reexporta la misma API pública.
// ============================================

import { DATABASE_SCHEMA_CONTEXT } from '../../../../lib/lia-context/database-schema';
import { GLOBAL_UI_CONTEXT, LIA_SYSTEM_PROMPT } from './prompt-base.service';
import { buildUserContextSection } from './prompt-context.service';
import {
  buildBusinessRoutesSection,
  buildPageInstructionsSection,
} from './prompt-instructions.service';
import type { PlatformContext } from './platform-context.service';

export { LIA_SYSTEM_PROMPT } from './prompt-base.service';

export function getLIASystemPrompt(context?: PlatformContext): string {
  // 1. Base prompt (may have business routes replaced)
  let prompt = context
    ? buildBusinessRoutesSection(context, LIA_SYSTEM_PROMPT)
    : LIA_SYSTEM_PROMPT;

  // 2. Inject global UI glossary (with dynamic org-slug routes when available)
  const orgSlug = context?.organizationSlug || '';
  const orgPrefix = orgSlug ? `/${orgSlug}` : '';

  let globalContext = GLOBAL_UI_CONTEXT;
  if (orgSlug) {
    globalContext = globalContext
      .replace(/\(\/business-panel\//g, `(${orgPrefix}/business-panel/`)
      .replace(/\(\/business-user\//g, `(${orgPrefix}/business-user/`)
      .replace(/Ruta base: \/business-panel/g, `Ruta base: ${orgPrefix}/business-panel`)
      .replace(/Ruta base: \/business-user/g, `Ruta base: ${orgPrefix}/business-user`);
  }
  prompt += '\n' + globalContext + '\n';

  // 3. Inject database schema context
  prompt += '\n' + DATABASE_SCHEMA_CONTEXT + '\n';

  if (context) {
    prompt += '\n\n## Contexto Actual de SOFLIA\n';

    // 4. Page-specific instructions (team detail, activity, lesson, metadata)
    prompt += buildPageInstructionsSection(context);

    // 5. User data preamble
    prompt += 'Usa esta información REAL de la base de datos para responder preguntas generales:\n';

    // 6. Dynamic user / courses context
    prompt += buildUserContextSection(context);
  }

  return prompt;
}
