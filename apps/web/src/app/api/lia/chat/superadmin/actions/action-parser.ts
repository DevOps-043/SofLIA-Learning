import { logger } from '@/lib/logger'
import { findActionDefinition } from './registry'
import type { ValidatedActionProposal } from './types'

/**
 * Extracción y validación de la acción que propone el modelo.
 *
 * El modelo emite un bloque con una acción o un lote ordenado:
 *   <soflia-action>{"actions":[{"action":"...","params":{...}}]}</soflia-action>
 *
 * Reglas (fail-closed):
 *  - Si el JSON no parsea, se descarta.
 *  - Si la acción no está en la allowlist del registro, se descarta.
 *  - Si los parámetros no pasan el schema Zod, se descarta con el motivo.
 * En todos los casos, "descartar" significa que NO habrá propuesta ni ejecución.
 */

const ACTION_BLOCK_PATTERN = /<soflia-action>([\s\S]*?)<\/soflia-action>/
const MAX_ACTIONS_PER_BATCH = 5

export type ActionParseOutcome =
  | { status: 'none' }
  | {
      status: 'valid'
      /** Primer elemento, por compatibilidad con consumidores anteriores. */
      proposal: ValidatedActionProposal
      proposals: ValidatedActionProposal[]
    }
  | { status: 'invalid'; reason: string }

interface RawActionBlock {
  action?: unknown
  params?: unknown
  actions?: unknown
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

export interface ActionBlockStreamMask {
  push(chunk: string): string
  flush(): string
}

const ACTION_OPEN = '<soflia-action>'
const ACTION_CLOSE = '</soflia-action>'

function longestSuffixMatchingPrefix(value: string, marker: string): number {
  const maxLength = Math.min(value.length, marker.length - 1)
  for (let length = maxLength; length > 0; length -= 1) {
    if (value.endsWith(marker.slice(0, length))) return length
  }
  return 0
}

/**
 * Oculta bloques de acción mientras llegan en fragmentos arbitrarios del LLM.
 * Permite locutar el texto natural inmediatamente sin filtrar el JSON interno.
 */
export function createActionBlockStreamMask(): ActionBlockStreamMask {
  let pending = ''
  let insideAction = false

  return {
    push(chunk: string): string {
      pending += chunk
      let visible = ''

      while (pending) {
        const marker = insideAction ? ACTION_CLOSE : ACTION_OPEN
        const markerIndex = pending.indexOf(marker)

        if (markerIndex >= 0) {
          if (!insideAction) visible += pending.slice(0, markerIndex)
          pending = pending.slice(markerIndex + marker.length)
          insideAction = !insideAction
          continue
        }

        const retainedLength = longestSuffixMatchingPrefix(pending, marker)
        if (!insideAction) {
          visible += pending.slice(0, pending.length - retainedLength)
        }
        pending = retainedLength > 0 ? pending.slice(-retainedLength) : ''
        break
      }

      return visible
    },

    flush(): string {
      const remaining = insideAction ? '' : pending
      pending = ''
      return remaining
    },
  }
}

/**
 * Parsea y valida la acción propuesta por el modelo.
 * No ejecuta nada: solo produce una propuesta válida o un descarte.
 */
export function parseActionProposal(content: string): ActionParseOutcome {
  const matches = [...content.matchAll(new RegExp(ACTION_BLOCK_PATTERN.source, 'g'))]
  if (matches.length === 0) return { status: 'none' }

  const rawActions: RawActionBlock[] = []
  for (const match of matches) {
    let parsed: unknown
    try {
      parsed = JSON.parse(match[1].trim())
    } catch {
      return { status: 'invalid', reason: 'El bloque de acción no es JSON válido.' }
    }

    if (Array.isArray(parsed)) {
      rawActions.push(...(parsed as RawActionBlock[]))
      continue
    }

    const rawBlock = parsed as RawActionBlock
    if (Array.isArray(rawBlock?.actions)) {
      rawActions.push(...(rawBlock.actions as RawActionBlock[]))
    } else {
      rawActions.push(rawBlock)
    }
  }

  if (rawActions.length === 0) {
    return { status: 'invalid', reason: 'El bloque de acción no indica ninguna acción.' }
  }
  if (rawActions.length > MAX_ACTIONS_PER_BATCH) {
    return {
      status: 'invalid',
      reason: `Solo se pueden confirmar hasta ${MAX_ACTIONS_PER_BATCH} acciones a la vez.`,
    }
  }

  const proposals: ValidatedActionProposal[] = []
  for (const rawBlock of rawActions) {
    if (!rawBlock || typeof rawBlock.action !== 'string' || !rawBlock.action.trim()) {
      return { status: 'invalid', reason: 'Una de las acciones no indica un identificador válido.' }
    }

    const definition = findActionDefinition(rawBlock.action.trim())
    if (!definition) {
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
    proposals.push({ definition, params: parsedParams.params })
  }

  return { status: 'valid', proposal: proposals[0], proposals }
}
