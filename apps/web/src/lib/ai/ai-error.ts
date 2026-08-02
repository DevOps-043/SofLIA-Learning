/**
 * Extracción del detalle de un error de un proveedor de IA (Gemini u OpenAI).
 *
 * MOTIVO: un fallo del proveedor se registraba solo como `error.message`, que en
 * los 4xx queda como un texto opaco. Sin el código HTTP, el estado de la API
 * (`INVALID_ARGUMENT`, `RESOURCE_EXHAUSTED`, `insufficient_quota`, …) ni el
 * motivo, un 400 en producción no es diagnosticable: no se distingue un esquema
 * inválido de un límite de tokens o de una clave sin permisos.
 *
 * POR QUÉ SIRVE PARA AMBOS PROVEEDORES: las dos APIs devuelven el detalle en un
 * objeto `error` anidado (`{ error: { message, status|type, code } }`), bien como
 * propiedad del error lanzado, bien embebido como JSON dentro del mensaje. Este
 * módulo lee las dos formas, por lo que no necesita saber de quién viene.
 *
 * PRIVACIDAD: solo se extraen metadatos del error. El prompt y el contenido del
 * usuario NUNCA se incluyen; el mensaje se recorta para evitar que un eco del
 * input acabe en los logs.
 *
 * Módulo puro y sin dependencias: es seguro usarlo desde cualquier capa.
 */

/** Longitud máxima del mensaje registrado, por si la API refleja parte del input. */
const MAX_LOGGED_MESSAGE_LENGTH = 300

export interface AiProviderErrorDetails {
  /** Estado canónico del proveedor (INVALID_ARGUMENT, insufficient_quota…). */
  apiStatus: string | null
  /** Código HTTP devuelto por la API (400, 429, 503…), si se pudo determinar. */
  httpStatus: number | null
  /** Mensaje recortado y seguro para registrar. */
  message: string
  /** Motivo específico cuando la API lo detalla. */
  reason: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Algunos SDK entregan el cuerpo de error del proveedor embebido como JSON
 * dentro del mensaje (`[400 Bad Request] {"error":{...}}`). Se intenta recuperar
 * ese objeto para no perder el motivo real.
 */
function parseEmbeddedErrorBody(message: string): Record<string, unknown> | null {
  const firstBrace = message.indexOf('{')
  const lastBrace = message.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace <= firstBrace) return null

  try {
    const parsed: unknown = JSON.parse(message.slice(firstBrace, lastBrace + 1))
    const record = asRecord(parsed)
    if (!record) return null
    return asRecord(record.error) ?? record
  } catch {
    return null
  }
}

function readHttpStatusFromMessage(message: string): number | null {
  // Formato habitual del SDK: "[400 Bad Request] ..." o "got status: 400".
  const match = message.match(/\[(\d{3})\s|status:?\s*(\d{3})/i)
  const raw = match?.[1] ?? match?.[2]
  return raw ? Number(raw) : null
}

/**
 * Normaliza cualquier error lanzado por los SDK de IA a un objeto de metadatos
 * apto para registrar.
 */
export function describeAiProviderError(error: unknown): AiProviderErrorDetails {
  const rawMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const message = rawMessage.slice(0, MAX_LOGGED_MESSAGE_LENGTH)

  const errorRecord = asRecord(error)
  // El detalle puede venir en `error.error`, `error.response.data.error` o
  // embebido como JSON dentro del propio mensaje.
  const nested =
    asRecord(errorRecord?.error) ??
    asRecord(asRecord(asRecord(errorRecord?.response)?.data)?.error) ??
    parseEmbeddedErrorBody(rawMessage)

  const httpStatus =
    readNumber(errorRecord?.status) ??
    readNumber(nested?.code) ??
    readNumber(asRecord(errorRecord?.response)?.status) ??
    readHttpStatusFromMessage(rawMessage)

  // Gemini usa `status` ("RESOURCE_EXHAUSTED"); OpenAI usa `type`
  // ("insufficient_quota", "invalid_request_error") y, cuando lo detalla, un
  // `code` textual ("rate_limit_exceeded").
  const apiStatus =
    readString(nested?.status) ??
    readString(nested?.type) ??
    readString(errorRecord?.statusText)

  const details = Array.isArray(nested?.details) ? nested.details : []
  const reason =
    readString(asRecord(details[0])?.reason) ??
    readString(nested?.code) ??
    readString(errorRecord?.code) ??
    readString(errorRecord?.reason)

  return {
    apiStatus,
    httpStatus,
    message: readString(nested?.message)?.slice(0, MAX_LOGGED_MESSAGE_LENGTH) ?? message,
    reason,
  }
}

/** `true` cuando el error corresponde a una petición rechazada por inválida (400). */
export function isAiProviderBadRequest(error: unknown): boolean {
  const { apiStatus, httpStatus } = describeAiProviderError(error)
  return httpStatus === 400 || apiStatus === 'INVALID_ARGUMENT'
}
