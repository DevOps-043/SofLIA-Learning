import type { NextRequest } from 'next/server'
import type { SessionUserRecord } from '@/features/auth/services/session.types'
import type { PromptRiskAction } from '@/lib/security/prompt-injection-detector.types'
import { buildAdminUserLookupPromptSection } from '../admin-user-lookup'
import { isPlatformAdminRole } from './authorization'
import {
  authorizeAdminActions,
  buildActionContext,
  buildAdminActionsPromptSection,
  processProposedAction,
  tryExecutePendingAction,
} from './actions'
import type { ActionContext } from './actions/types'

/**
 * Turno de SofLIA en modo superadmin.
 *
 * Concentra en un solo lugar todo lo que el chat hace distinto cuando el
 * usuario es superadmin de plataforma dentro de `/admin`, para que la ruta del
 * chat no acumule esa complejidad:
 *
 *  - `resolveSuperadminTurn`: decide si el turno tiene capacidades elevadas y,
 *    si el admin está confirmando una acción pendiente, la ejecuta ANTES de
 *    llamar al modelo (una confirmación no necesita generación).
 *  - `buildSuperadminPromptSections`: dossier de usuarios + catálogo de acciones.
 *  - `finalizeSuperadminResponse`: convierte una acción propuesta por el modelo
 *    en una solicitud de confirmación firmada.
 *
 * Si el usuario no es superadmin (o no está en /admin), todo queda inerte:
 * `isEnabled: false`, sin secciones de prompt y sin capacidad de ejecutar nada.
 */

export interface SuperadminTurn {
  /** true solo si la autorización de acciones concedió el grant. */
  isEnabled: boolean
  /** Contexto de ejecución de acciones; presente solo si `isEnabled`. */
  actionContext: ActionContext | null
  /**
   * Respuesta ya resuelta sin pasar por el modelo (el admin confirmó o canceló
   * una acción pendiente). Si viene, la ruta debe devolverla tal cual.
   */
  immediateResponse: string | null
}

const INERT_TURN: SuperadminTurn = {
  isEnabled: false,
  actionContext: null,
  immediateResponse: null,
}

export interface ResolveSuperadminTurnParams {
  sessionUser: SessionUserRecord | null
  currentPage: string | null | undefined
  promptRiskAction: PromptRiskAction
  request: NextRequest
  /** Último mensaje del asistente en la conversación (puede llevar un token). */
  latestAssistantContent: string | null
  /** Mensaje actual del admin. */
  userMessage: string
}

/**
 * Resuelve las capacidades elevadas del turno y ejecuta una confirmación
 * pendiente si la hay. No lanza: ante cualquier fallo devuelve un turno inerte.
 */
export async function resolveSuperadminTurn(
  params: ResolveSuperadminTurnParams,
): Promise<SuperadminTurn> {
  const { sessionUser } = params

  // Filtro barato antes de tocar la BD: la autorización real (panel, riesgo,
  // rate limit, re-verificación en BD) la hace `authorizeAdminActions`.
  if (!sessionUser || !isPlatformAdminRole(sessionUser.cargo_rol)) {
    return INERT_TURN
  }

  const grant = await authorizeAdminActions({
    sessionUser,
    currentPage: params.currentPage,
    promptRiskAction: params.promptRiskAction,
  })

  if (!grant) {
    return INERT_TURN
  }

  const actionContext = buildActionContext({ grant, request: params.request })

  const immediateResponse = await tryExecutePendingAction({
    context: actionContext,
    latestAssistantContent: params.latestAssistantContent,
    userMessage: params.userMessage,
  })

  return { isEnabled: true, actionContext, immediateResponse }
}

/**
 * Secciones del system prompt exclusivas del superadmin: consulta global de
 * usuarios (con dossier si procede) + catálogo de acciones ejecutables.
 * Devuelve '' si el turno no tiene capacidades elevadas.
 */
export async function buildSuperadminPromptSections(params: {
  turn: SuperadminTurn
  sessionUser: SessionUserRecord | null
  currentPage: string | null | undefined
  promptRiskAction: PromptRiskAction
  recentUserMessages: string[]
}): Promise<string> {
  if (!params.turn.isEnabled || !params.sessionUser) {
    return ''
  }

  const lookupSection = await buildAdminUserLookupPromptSection({
    sessionUser: params.sessionUser,
    currentPage: params.currentPage,
    promptRiskAction: params.promptRiskAction,
    recentUserMessages: params.recentUserMessages,
  })

  return lookupSection + buildAdminActionsPromptSection()
}

/**
 * Post-procesa la respuesta del modelo: si propuso una acción, la sustituye por
 * una solicitud de confirmación con token firmado. Nunca ejecuta nada aquí.
 */
export async function finalizeSuperadminResponse(params: {
  turn: SuperadminTurn
  assistantContent: string
}): Promise<string> {
  if (!params.turn.isEnabled || !params.turn.actionContext) {
    return params.assistantContent
  }

  return processProposedAction({
    context: params.turn.actionContext,
    assistantContent: params.assistantContent,
  })
}
