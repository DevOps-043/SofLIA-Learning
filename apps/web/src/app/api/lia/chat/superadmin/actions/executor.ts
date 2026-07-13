import { logger } from '@/lib/logger'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { assertPlatformSuperadminGrant } from '../authorization'
import { buildActionConfirmationMarker } from './confirmation-token'
import { EntityNotFoundError } from './entity-resolution'
import { findActionDefinition } from './registry'
import type {
  ActionContext,
  ActionConfirmationTokenPayload,
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
  preview: { summary: string; warnings?: string[] }
  proposal: ValidatedActionProposal
  context: ActionContext
}): string {
  assertPlatformSuperadminGrant(params.context.grant, 'admin-actions')

  const { preview, proposal, context } = params

  let message = '**Confirma esta acción antes de que la ejecute:**\n\n'
  message += `- ${preview.summary}\n`

  if (preview.warnings?.length) {
    message += '\n'
    for (const warning of preview.warnings) {
      message += `> ⚠️ ${warning}\n`
    }
  }

  message +=
    '\nResponde **"confirmo"** para ejecutarla, o dime qué cambiar. ' +
    'No haré nada hasta que confirmes.\n'

  message += buildActionConfirmationMarker({
    actionId: proposal.definition.id,
    params: proposal.params,
    adminUserId: context.adminUserId,
  })

  return message
}

/**
 * Construye la propuesta: valida el objetivo contra la BD y arma el mensaje de
 * confirmación. Si la entidad objetivo no existe, devuelve el motivo para que
 * SofLIA se lo explique al admin en lugar de ofrecer una confirmación inválida.
 */
export async function buildActionProposalMessage(params: {
  proposal: ValidatedActionProposal
  context: ActionContext
}): Promise<{ status: 'ready'; message: string } | { status: 'failed'; reason: string }> {
  const { proposal, context } = params
  assertPlatformSuperadminGrant(context.grant, 'admin-actions')

  try {
    const preview = await proposal.definition.preview(proposal.params, context)

    return {
      status: 'ready',
      message: buildActionConfirmationRequest({ preview, proposal, context }),
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
}): Promise<{ status: 'executed'; message: string } | { status: 'failed'; message: string }> {
  const { token, context } = params
  assertPlatformSuperadminGrant(context.grant, 'admin-actions')

  const definition = findActionDefinition(token.actionId)
  if (!definition) {
    return {
      status: 'failed',
      message: `La acción "${token.actionId}" ya no está disponible. No se ejecutó nada.`,
    }
  }

  const parsedParams = definition.parseParams(token.params)
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
      resourceType: 'superadmin-action',
      result: 'success',
      metadata: {
        operation: 'lia-admin-action',
        actionId: definition.id,
        risk: definition.risk,
        details: result.details ?? null,
      },
    })

    let message = `✅ ${result.summary}`
    if (result.details) {
      const detailLines = Object.entries(result.details)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `- ${key}: ${value}`)
      if (detailLines.length > 0) {
        message += `\n\n${detailLines.join('\n')}`
      }
    }

    return { status: 'executed', message }
  } catch (error) {
    // Se audita el intento fallido: un error en una acción privilegiada es
    // información de seguridad, no solo un fallo funcional.
    recordSecurityEvent('admin-operation', {
      actorId: context.adminUserId,
      actorRole: 'administrador',
      resourceType: 'superadmin-action',
      result: 'error',
      metadata: {
        operation: 'lia-admin-action',
        actionId: definition.id,
        risk: definition.risk,
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
