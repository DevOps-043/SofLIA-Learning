// ============================================
// ORQUESTADOR DEL PROMPT DE SISTEMA DE SofLIA
// ============================================

import type { PromptModelProfile } from '@/lib/ai/prompts';

import { buildLiaSystemPrompt } from './prompt-base.service';
import { GLOBAL_UI_CONTEXT } from './prompt-ui-glossary';
import { buildUserContextSection } from './prompt-context.service';
import {
  buildBusinessRoutesSection,
  buildPageInstructionsSection,
} from './prompt-instructions.service';
import type { PlatformContext } from './platform-context.service';

export { buildLiaSystemPrompt } from './prompt-base.service';

/**
 * Reescribe las rutas del glosario para la organización activa.
 *
 * El glosario se escribió con rutas sin prefijo de organización; en un tenant
 * concreto esas rutas dan 404. Sustituirlas evita que SofLIA proponga enlaces
 * rotos, que es el fallo que más rápido destruye la confianza en el asistente.
 */
function applyOrganizationRoutes(glossary: string, orgSlug: string): string {
  if (!orgSlug) return glossary;

  const orgPrefix = `/${orgSlug}`;

  return glossary
    .replace(/\(\/business-panel\//g, `(${orgPrefix}/business-panel/`)
    .replace(/\(\/business-user\//g, `(${orgPrefix}/business-user/`)
    .replace(/Ruta base: \/business-panel/g, `Ruta base: ${orgPrefix}/business-panel`)
    .replace(/Ruta base: \/business-user/g, `Ruta base: ${orgPrefix}/business-user`);
}

/**
 * Prompt de sistema completo de SofLIA para el proveedor destino.
 *
 * El glosario de pantallas y el contexto del usuario son DATOS: se adjuntan
 * igual en las dos variantes. Lo que cambia según el proveedor es únicamente el
 * prompt base de comportamiento.
 */
export function getLIASystemPrompt(
  profile: PromptModelProfile,
  context?: PlatformContext,
): string {
  const basePrompt = buildLiaSystemPrompt(profile);
  let prompt = context
    ? buildBusinessRoutesSection(context, basePrompt)
    : basePrompt;

  prompt +=
    '\n' + applyOrganizationRoutes(GLOBAL_UI_CONTEXT, context?.organizationSlug || '') + '\n';

  if (context) {
    prompt += '\n\n## Contexto Actual de SOFLIA\n';
    prompt += buildPageInstructionsSection(context);
    prompt +=
      'Usa esta informacion verificada de la plataforma solo para personalizar y contextualizar tus respuestas. Nunca expongas detalles tecnicos internos ni su origen.\n';
    prompt += buildUserContextSection(context);
  }

  return prompt;
}
