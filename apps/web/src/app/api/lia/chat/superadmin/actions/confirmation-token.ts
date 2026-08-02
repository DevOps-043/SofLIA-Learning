import { signToken, verifyToken } from '@/lib/security/signed-token'
import type { ActionConfirmationTokenPayload } from './types'
import type { AdminActionScope } from './types'
import type { ConfirmedActionItem } from './types'

/**
 * Token de confirmación de acciones administrativas.
 *
 * Se emite en la fase de propuesta y viaja embebido en el mensaje del asistente
 * (igual que el borrador de reporte de bug). Está FIRMADO con HMAC porque el
 * contenido del turno anterior es material que el modelo puede reproducir: sin
 * firma, un mensaje que "parezca" un token confirmable bastaría para disparar
 * una ejecución. Con firma:
 *
 *  - la carga (acción + parámetros) no se puede alterar sin invalidar la firma;
 *  - queda ligada al `adminUserId` que la solicitó (no la reutiliza otra sesión);
 *  - caduca (`exp`), por lo que no se puede replicar más tarde.
 */

const ACTION_TOKEN_PATTERN =
  /\[\[SOFLIA_ACTION:([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\]\]/

/** Ventana de confirmación. Pasado este tiempo el admin debe volver a pedirla. */
const CONFIRMATION_TTL_MS = 15 * 60 * 1000

/** Serializa el token firmado con su marcador, para embeberlo en el mensaje. */
export function buildActionConfirmationMarker(params: {
  actions?: ConfirmedActionItem[]
  actionId?: string
  params?: unknown
  adminUserId: string
  actorScope?: AdminActionScope
  organizationId?: string | null
}): string {
  const token = signToken<ActionConfirmationTokenPayload>({
    actions: params.actions,
    actionId: params.actionId,
    params: params.params,
    adminUserId: params.adminUserId,
    actorScope: params.actorScope,
    organizationId: params.organizationId ?? null,
    exp: Date.now() + CONFIRMATION_TTL_MS,
  })

  return `[[SOFLIA_ACTION:${token}]]`
}

/**
 * Extrae y VERIFICA el token de un mensaje del asistente.
 *
 * Devuelve `null` si no hay token, si la firma no es válida, si caducó o si
 * pertenece a otro administrador (fail-closed en todos los casos).
 */
export function extractVerifiedActionToken(params: {
  assistantContent: string
  adminUserId: string
  actorScope?: AdminActionScope
  organizationId?: string | null
}): ActionConfirmationTokenPayload | null {
  const match = params.assistantContent.match(ACTION_TOKEN_PATTERN)
  if (!match) return null

  const payload = verifyToken<ActionConfirmationTokenPayload>(match[1])
  if (!payload) return null

  // Ligado al admin: un token emitido a otra sesión no vale aquí.
  if (payload.adminUserId !== params.adminUserId) return null
  const hasLegacyAction = typeof payload.actionId === 'string' && Boolean(payload.actionId)
  const hasActionBatch =
    Array.isArray(payload.actions) &&
    payload.actions.length > 0 &&
    payload.actions.length <= 5 &&
    payload.actions.every(
      (action) => action && typeof action.actionId === 'string' && Boolean(action.actionId),
    )
  if (!hasLegacyAction && !hasActionBatch) return null
  if (params.actorScope && payload.actorScope !== params.actorScope) return null
  if (
    params.actorScope === 'organization' &&
    payload.organizationId !== params.organizationId
  ) return null

  return payload
}

/** Elimina los marcadores de token del texto que se muestra o persiste. */
export function stripActionTokens(content: string): string {
  return content
    .replace(new RegExp(ACTION_TOKEN_PATTERN.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const LEGACY_VISIBLE_DETAIL_KEYS = [
  'userId',
  'organizationId',
  'assignmentsRemoved',
  'courseId',
  'assigned',
  'assignmentId',
  'learningPathId',
  'nodeId',
  'structureId',
  'parentNodeId',
  'reportDate',
  'fileName',
  'reportUrl',
  'banned',
  'temporaryPassword',
  'ruleId',
  'inviteToken',
  'expiresAt',
  'brandingEnabled',
  'slug',
].join('|')

const LEGACY_ACTION_DETAILS_PATTERN = new RegExp(
  `\\n{2,}(?:-\\s+(?:${LEGACY_VISIBLE_DETAIL_KEYS}):\\s*[^\\r\\n]*(?:\\r?\\n|$))+\\s*$`,
  'u',
)

/**
 * Sanitiza contenido administrativo antes de pantalla, voz o exportación.
 * También limpia los bloques de IDs que versiones anteriores ya persistieron.
 */
export function stripActionInternalContent(content: string): string {
  const withoutToken = stripActionTokens(content)
  if (!withoutToken.trimStart().startsWith('✅')) return withoutToken
  return withoutToken.replace(LEGACY_ACTION_DETAILS_PATTERN, '').trim()
}
