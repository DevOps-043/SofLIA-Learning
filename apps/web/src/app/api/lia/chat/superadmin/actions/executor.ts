import { logger } from '@/lib/logger'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { assertAdminActionGrant } from '../authorization'
import { buildActionConfirmationMarker } from './confirmation-token'
import { EntityNotFoundError } from './entity-resolution'
import { findActionDefinition } from './registry'
import {
  buildActionAuditDetails,
  buildVisibleActionExecutionMessage,
} from './action-result.visibility'
import type {
  ActionDownloadRequest,
  ActionContext,
  ActionConfirmationTokenPayload,
  ConfirmedActionItem,
  ValidatedActionProposal,
} from './types'

/**
 * Motor de ejecución de acciones administrativas (dos fases).
 *
 * Fase 1 — `buildActionConfirmationRequest`: resuelve las entidades objetivo,
 *   describe el efecto real y emite el token firmado. NO muta nada.
 * Fase 2 — `executeConfirmedAction`: verifica el grant, revalida los parámetros
 *   contra el schema y ejecuta el handler, que delega en los servicios admin.
 *
 * Ambas fases exigen el grant de capacidad `admin-actions`, y toda ejecución
 * (exitosa o fallida) queda auditada con actor, acción y objetivo.
 */

/** Texto que se muestra al admin para que confirme, con el token embebido. */
export function buildActionConfirmationRequest(params: {
  previews: Array<{ summary: string; warnings?: string[] }>
  proposals: ValidatedActionProposal[]
  context: ActionContext
}): string {
  assertAdminActionGrant(params.context.grant)

  const { previews, proposals, context } = params
  const plural = proposals.length > 1

  let message = `**Confirma ${plural ? 'estas acciones' : 'esta acción'} antes de que ${plural ? 'las' : 'la'} ejecute:**\n\n`
  previews.forEach((preview, index) => {
    message += `${index + 1}. ${preview.summary}\n`
    if (preview.warnings?.length) {
      for (const warning of preview.warnings) {
        message += `   > ⚠️ ${warning}\n`
      }
    }
  })

  message +=
    `\nSe ejecutarán en este orden. Responde **"confirmo"** para ${plural ? 'ejecutarlas' : 'ejecutarla'}, o dime qué cambiar. ` +
    'No haré nada hasta que confirmes.\n'

  message += buildActionConfirmationMarker({
    actions: proposals.map((proposal) => ({
      actionId: proposal.definition.id,
      params: proposal.params,
    })),
    adminUserId: context.adminUserId,
    actorScope: context.actorScope,
    organizationId: context.organizationId,
  })

  return message
}

/**
 * Construye la propuesta: valida el objetivo contra la BD y arma el mensaje de
 * confirmación. Si la entidad objetivo no existe, devuelve el motivo para que
 * SofLIA se lo explique al admin en lugar de ofrecer una confirmación inválida.
 */
export async function buildActionProposalMessage(params: {
  proposals: ValidatedActionProposal[]
  context: ActionContext
}): Promise<{ status: 'ready'; message: string } | { status: 'failed'; reason: string }> {
  const { proposals, context } = params
  assertAdminActionGrant(context.grant)

  if (proposals.some((proposal) => !proposal.definition.allowedScopes.includes(context.actorScope))) {
    return { status: 'failed', reason: 'Esta acción no está permitida en este panel.' }
  }

  try {
    const previews = []
    for (const proposal of proposals) {
      previews.push(await proposal.definition.preview(proposal.params, context))
    }

    return {
      status: 'ready',
      message: buildActionConfirmationRequest({ previews, proposals, context }),
    }
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      return { status: 'failed', reason: error.message }
    }

    logger.error('SofLIA acciones: fallo al construir la vista previa', error)
    return {
      status: 'failed',
      reason: 'No pude preparar la acción por un error interno. Inténtalo de nuevo.',
    }
  }
}

/**
 * Ejecuta una acción previamente confirmada por el admin.
 *
 * El `token` ya viene verificado criptográficamente (firma + expiración +
 * pertenencia al admin). Aun así se revalidan los parámetros contra el schema:
 * el registro de acciones puede haber cambiado desde que se emitió el token.
 */
export async function executeConfirmedAction(params: {
  token: ActionConfirmationTokenPayload
  context: ActionContext
}): Promise<
  | {
      status: 'executed'
      message: string
      navigateTo?: string
      downloads?: ActionDownloadRequest[]
    }
  | {
      status: 'failed'
      message: string
      navigateTo?: string
      downloads?: ActionDownloadRequest[]
    }
> {
  const { token, context } = params
  assertAdminActionGrant(context.grant)

  const actions = normalizeConfirmedActions(token)
  if (actions.length === 0 || actions.length > 5) {
    return { status: 'failed', message: 'La confirmación no contiene acciones válidas. No se ejecutó nada.' }
  }

  const completed: Array<{
    message: string
    navigateTo?: string
    downloads?: ActionDownloadRequest[]
  }> = []

  for (const action of actions) {
    const result = await executeConfirmedActionItem({ action, context })
    if (result.status === 'failed') {
      if (completed.length === 0) return result
      return {
        status: 'failed',
        message:
          `${completed.map((item, index) => `${index + 1}. ${item.message}`).join('\n')}\n\n` +
          `❌ El lote se detuvo en la acción ${completed.length + 1}. ${result.message}`,
        navigateTo: [...completed].reverse().find((item) => item.navigateTo)?.navigateTo,
        downloads: completed.flatMap((item) => item.downloads ?? []),
      }
    }
    completed.push(result)
  }

  return {
    status: 'executed',
    message: completed.length === 1
      ? completed[0].message
      : completed.map((item, index) => `${index + 1}. ${item.message}`).join('\n'),
    navigateTo: [...completed].reverse().find((item) => item.navigateTo)?.navigateTo,
    downloads: completed.flatMap((item) => item.downloads ?? []),
  }
}

function normalizeConfirmedActions(token: ActionConfirmationTokenPayload): ConfirmedActionItem[] {
  if (Array.isArray(token.actions)) return token.actions
  if (typeof token.actionId === 'string' && token.actionId) {
    return [{ actionId: token.actionId, params: token.params }]
  }
  return []
}

async function executeConfirmedActionItem(params: {
  action: ConfirmedActionItem
  context: ActionContext
}): Promise<
  | {
      status: 'executed'
      message: string
      navigateTo?: string
      downloads?: ActionDownloadRequest[]
    }
  | { status: 'failed'; message: string }
> {
  const { action, context } = params

  const definition = findActionDefinition(action.actionId)
  if (!definition) {
    return {
      status: 'failed',
      message: `La acción "${action.actionId}" ya no está disponible.`,
    }
  }

  if (!definition.allowedScopes.includes(context.actorScope)) {
    return {
      status: 'failed',
      message: 'Esta acción no está permitida para tu alcance administrativo. No se ejecutó nada.',
    }
  }

  const parsedParams = definition.parseParams(action.params)
  if (!parsedParams.success) {
    return {
      status: 'failed',
      message: 'Los parámetros de la acción dejaron de ser válidos. No se ejecutó nada.',
    }
  }

  try {
    const result = await definition.execute(parsedParams.params, context)

    recordSecurityEvent('admin-operation', {
      actorId: context.adminUserId,
      actorRole: 'administrador',
      resourceType: context.actorScope === 'platform' ? 'superadmin-action' : 'organization-admin-action',
      result: 'success',
      metadata: {
        operation: 'lia-admin-action',
        actionId: definition.id,
        risk: definition.risk,
        details: buildActionAuditDetails(result.details) ?? null,
        organizationId: context.organizationId,
      },
    })

    return {
      status: 'executed',
      message: buildVisibleActionExecutionMessage(result),
      navigateTo: result.navigateTo,
      downloads: result.downloads,
    }
  } catch (error) {
    // Se audita el intento fallido: un error en una acción privilegiada es
    // información de seguridad, no solo un fallo funcional.
    recordSecurityEvent('admin-operation', {
      actorId: context.adminUserId,
      actorRole: 'administrador',
      resourceType: context.actorScope === 'platform' ? 'superadmin-action' : 'organization-admin-action',
      result: 'error',
      metadata: {
        operation: 'lia-admin-action',
        actionId: definition.id,
        risk: definition.risk,
        organizationId: context.organizationId,
      },
    })
    logger.error('SofLIA acciones: fallo al ejecutar la acción', error)

    const reason =
      error instanceof EntityNotFoundError
        ? error.message
        : 'La acción falló por un error interno. No se aplicaron cambios parciales conocidos; revisa el panel para verificar el estado.'

    return { status: 'failed', message: `❌ No se pudo completar la acción. ${reason}` }
  }
}
