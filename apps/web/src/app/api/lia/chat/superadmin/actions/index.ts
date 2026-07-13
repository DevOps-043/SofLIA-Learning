import type { NextRequest } from 'next/server'
import type { SessionUserRecord } from '@/features/auth/services/session.types'
import type { PromptRiskAction } from '@/lib/security/prompt-injection-detector.types'
import {
  authorizePlatformSuperadmin,
  type PlatformSuperadminGrant,
} from '../authorization'
import { parseActionProposal, stripActionBlock } from './action-parser'
import { buildAdminActionsPromptSection } from './actions.prompt'
import { detectActionConfirmationIntent } from './confirmation-intent'
import {
  extractVerifiedActionToken,
  stripActionTokens,
} from './confirmation-token'
import { buildActionProposalMessage, executeConfirmedAction } from './executor'
import type { ActionContext } from './types'

/**
 * Copiloto de acciones administrativas de SofLIA — punto de entrada del módulo.
 *
 * Orquesta el ciclo completo, siempre bajo el grant `admin-actions`:
 *
 *   authorizeAdminActions()          → ¿este turno puede usar acciones?
 *   tryExecutePendingAction()        → ¿el admin está confirmando la anterior?
 *   buildAdminActionsPromptSection() → catálogo para que el modelo proponga
 *   processProposedAction()          → convierte la propuesta en confirmación
 */

export { stripActionTokens } from './confirmation-token'
export { hasActionBlock, stripActionBlock } from './action-parser'
export { buildAdminActionsPromptSection } from './actions.prompt'

export interface AdminActionsAuthorizationParams {
  sessionUser: SessionUserRecord
  currentPage: string | null | undefined
  promptRiskAction: PromptRiskAction
}

/**
 * Autoriza la capacidad de acciones para este turno.
 * `null` = el turno no puede proponer ni ejecutar nada (fail-closed).
 */
export async function authorizeAdminActions(
  params: AdminActionsAuthorizationParams,
): Promise<PlatformSuperadminGrant | null> {
  return authorizePlatformSuperadmin({
    capability: 'admin-actions',
    sessionUserId: params.sessionUser.id,
    sessionUserRole: params.sessionUser.cargo_rol,
    currentPage: params.currentPage,
    promptRiskAction: params.promptRiskAction,
  })
}

/** Construye el contexto de ejecución que reciben los handlers. */
export function buildActionContext(params: {
  grant: PlatformSuperadminGrant
  request: NextRequest
}): ActionContext {
  const { grant, request } = params

  return {
    grant,
    adminUserId: grant.adminUserId,
    requestInfo: {
      ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  }
}

/**
 * FASE 2 — ¿el admin está confirmando una acción propuesta en el turno anterior?
 *
 * Solo ejecuta si se cumplen TODAS estas condiciones:
 *  - el mensaje anterior del asistente lleva un token con firma válida, no
 *    caducado y emitido para ESTE admin;
 *  - el mensaje actual del admin es una confirmación explícita e inequívoca.
 *
 * Devuelve `null` cuando no hay nada que confirmar, para que el turno siga su
 * curso normal hacia el modelo.
 */
export async function tryExecutePendingAction(params: {
  context: ActionContext
  latestAssistantContent: string | null
  userMessage: string
}): Promise<string | null> {
  const { context, latestAssistantContent, userMessage } = params

  if (!latestAssistantContent) return null

  const token = extractVerifiedActionToken({
    assistantContent: latestAssistantContent,
    adminUserId: context.adminUserId,
  })
  if (!token) return null

  const intent = detectActionConfirmationIntent(userMessage)

  if (intent === 'cancel') {
    return 'Entendido, cancelo la acción. No se ejecutó ningún cambio.'
  }

  if (intent !== 'confirm') {
    // Ambiguo: no se ejecuta. El turno continúa hacia el modelo, que puede
    // aclarar la duda del admin sin que nada se aplique.
    return null
  }

  const result = await executeConfirmedAction({ token, context })
  return result.message
}

/**
 * FASE 1 — convierte la acción propuesta por el modelo en una solicitud de
 * confirmación con token firmado.
 *
 * Devuelve el texto que se le muestra al admin. Si el modelo no propuso nada,
 * devuelve el contenido original sin tocar.
 */
export async function processProposedAction(params: {
  context: ActionContext
  assistantContent: string
}): Promise<string> {
  const { context, assistantContent } = params

  const outcome = parseActionProposal(assistantContent)
  const visibleContent = stripActionBlock(assistantContent)

  if (outcome.status === 'none') {
    return assistantContent
  }

  if (outcome.status === 'invalid') {
    // El modelo propuso algo inválido o inexistente: se descarta la acción y se
    // le dice al admin, en lugar de ejecutar una aproximación.
    return `${visibleContent}\n\n⚠️ No pude preparar esa acción: ${outcome.reason}`.trim()
  }

  const proposal = await buildActionProposalMessage({
    proposal: outcome.proposal,
    context,
  })

  if (proposal.status === 'failed') {
    return `${visibleContent}\n\n⚠️ No pude preparar esa acción: ${proposal.reason}`.trim()
  }

  return `${visibleContent}\n\n${proposal.message}`.trim()
}
