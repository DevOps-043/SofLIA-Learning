import { signToken, verifyToken } from '@/lib/security/signed-token'
import type { ActionConfirmationTokenPayload } from './types'

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
  actionId: string
  params: unknown
  adminUserId: string
}): string {
  const token = signToken<ActionConfirmationTokenPayload>({
    actionId: params.actionId,
    params: params.params,
    adminUserId: params.adminUserId,
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
}): ActionConfirmationTokenPayload | null {
  const match = params.assistantContent.match(ACTION_TOKEN_PATTERN)
  if (!match) return null

  const payload = verifyToken<ActionConfirmationTokenPayload>(match[1])
  if (!payload) return null

  // Ligado al admin: un token emitido a otra sesión no vale aquí.
  if (payload.adminUserId !== params.adminUserId) return null
  if (typeof payload.actionId !== 'string' || !payload.actionId) return null

  return payload
}

/** Elimina los marcadores de token del texto que se muestra o persiste. */
export function stripActionTokens(content: string): string {
  return content
    .replace(new RegExp(ACTION_TOKEN_PATTERN.source, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
