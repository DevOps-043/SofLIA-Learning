import { logger } from '@/lib/logger'
import { findActionDefinition } from './registry'
import type { ValidatedActionProposal } from './types'

/**
 * Extracción y validación de la acción que propone el modelo.
 *
 * El modelo emite un único bloque:
 *   <soflia-action>{"action":"set_user_ban","params":{...}}</soflia-action>
 *
 * Reglas (fail-closed):
 *  - Si el JSON no parsea, se descarta.
 *  - Si la acción no está en la allowlist del registro, se descarta.
 *  - Si los parámetros no pasan el schema Zod, se descarta con el motivo.
 * En todos los casos, "descartar" significa que NO habrá propuesta ni ejecución.
 */

const ACTION_BLOCK_PATTERN = /<soflia-action>([\s\S]*?)<\/soflia-action>/

export type ActionParseOutcome =
  | { status: 'none' }
  | { status: 'valid'; proposal: ValidatedActionProposal }
  | { status: 'invalid'; reason: string }

interface RawActionBlock {
  action?: unknown
  params?: unknown
}

/** Quita el bloque de acción del texto que se muestra al admin. */
export function stripActionBlock(content: string): string {
  return content
    .replace(new RegExp(ACTION_BLOCK_PATTERN.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Indica si la respuesta del modelo contiene un bloque de acción. */
export function hasActionBlock(content: string): boolean {
  return ACTION_BLOCK_PATTERN.test(content)
}

/**
 * Parsea y valida la acción propuesta por el modelo.
 * No ejecuta nada: solo produce una propuesta válida o un descarte.
 */
export function parseActionProposal(content: string): ActionParseOutcome {
  const match = content.match(ACTION_BLOCK_PATTERN)
  if (!match) return { status: 'none' }

  let rawBlock: RawActionBlock
  try {
    rawBlock = JSON.parse(match[1].trim()) as RawActionBlock
  } catch {
    return { status: 'invalid', reason: 'El bloque de acción no es JSON válido.' }
  }

  if (typeof rawBlock.action !== 'string' || !rawBlock.action.trim()) {
    return { status: 'invalid', reason: 'El bloque de acción no indica ninguna acción.' }
  }

  const definition = findActionDefinition(rawBlock.action.trim())
  if (!definition) {
    // El modelo inventó una acción fuera de la allowlist.
    logger.warn('SofLIA acciones: acción no registrada descartada', {
      actionId: rawBlock.action,
    })
    return {
      status: 'invalid',
      reason: `La acción "${rawBlock.action}" no existe en el catálogo de acciones permitidas.`,
    }
  }

  const parsedParams = definition.parseParams(rawBlock.params ?? {})
  if (!parsedParams.success) {
    return { status: 'invalid', reason: parsedParams.message }
  }

  return {
    status: 'valid',
    proposal: { definition, params: parsedParams.params },
  }
}
