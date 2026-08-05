import type { ExtractedToken } from './types'
import { parseJsonPayload } from './parsing'

export const BUG_REPORT_DRAFT_REGEX = /\[\[BUG_REPORT_DRAFT:(\{[\s\S]*?\})\]\]/
export const BUG_REPORT_REGEX = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/

/**
 * Marca el turno en que SofLIA ABRIO el flujo de reporte pero todavia no tiene
 * datos suficientes para redactar un borrador (tipicamente cuando le pide al
 * usuario que describa que ocurrio).
 *
 * Sin esta marca el flujo no tiene memoria: la intencion se reevalua en cada
 * turno con `detectTechnicalBugReportIntent`, y la descripcion que el usuario
 * escribe DESPUES rara vez contiene las palabras que ese detector busca ("se
 * rompio X", "marco un error"). El turno vuelve a tratarse como charla comun, el
 * modelo no emite el bloque oculto y el reporte se pierde sin que nadie lo note.
 *
 * Es tambien la senal que permite distinguir un "confirmo" dentro del flujo de
 * reporte de un "confirmo" cualquiera de la conversacion: sin ella, cualquier
 * afirmacion tendria que interpretarse como confirmacion de reporte.
 */
export const BUG_REPORT_PENDING_MARKER = '[[BUG_REPORT_PENDING]]'
const BUG_REPORT_PENDING_REGEX = /\[\[BUG_REPORT_PENDING\]\]/g

export const BUG_REPORT_CONFIRMATION_REMINDER =
  'Confirmas que este reporte tecnico quedo correcto para enviarlo al equipo? Si algo no refleja bien el problema, dime que ajustar.'

/**
 * Respuesta determinista a un "confirmo" que llega antes de que exista borrador.
 *
 * El modelo, ante una confirmacion sin contexto, tiende a responder que el
 * reporte "quedo confirmado y el sistema continuara con el envio". Es falso: no
 * hay nada que enviar. El usuario cierra el chat convencido de que reporto, y el
 * equipo nunca ve la incidencia. Esta respuesta no pasa por el modelo.
 */
export const BUG_REPORT_MISSING_DRAFT_REPLY =
  'Todavia no tengo el detalle del problema, asi que aun no hay ningun reporte que confirmar. ' +
  'Cuentame que ocurrio, en que seccion de la plataforma paso y que esperabas que pasara: ' +
  'con eso preparo el borrador tecnico y te lo muestro para que lo confirmes antes de enviarlo.'

export function extractToken<T>(content: string, regex: RegExp): ExtractedToken<T> | null {
  const match = content.match(regex)

  if (!match?.[1]) {
    return null
  }

  return {
    payload: parseJsonPayload<T>(match[1]),
    token: match[0],
  }
}

/**
 * Indica si la respuesta del modelo trae un bloque oculto de reporte. Es la
 * senal autoritativa del flujo: el modelo decide semanticamente que hay una
 * incidencia que reportar, y el servidor debe respetar esa decision.
 */
export function containsBugReportToken(content: string): boolean {
  return BUG_REPORT_DRAFT_REGEX.test(content) || BUG_REPORT_REGEX.test(content)
}

export function stripTokenMarkers(content: string): string {
  return content
    .replace(BUG_REPORT_DRAFT_REGEX, '')
    .replace(BUG_REPORT_REGEX, '')
    .replace(BUG_REPORT_PENDING_REGEX, '')
    .trim()
}

/**
 * `true` cuando el ultimo turno del asistente dejo el flujo de reporte abierto a
 * la espera de que el usuario describa el problema.
 */
export function awaitsBugReportDetails(content: string): boolean {
  return content.includes(BUG_REPORT_PENDING_MARKER)
}

/** Marca el contenido a persistir como "flujo de reporte abierto, sin borrador". */
export function markPendingBugReportDetails(content: string): string {
  return awaitsBugReportDetails(content)
    ? content
    : `${content}\n\n${BUG_REPORT_PENDING_MARKER}`
}

export function requestsBugReportConfirmation(content: string): boolean {
  return /confirmas|esta correcto|está correcto|quieres que lo envie|quieres que lo envíe|puedo enviarlo/i.test(
    content,
  )
}

export function ensureConfirmationPrompt(content: string): string {
  if (!content.trim()) return BUG_REPORT_CONFIRMATION_REMINDER
  if (requestsBugReportConfirmation(content)) return content.trim()

  return `${content.trim()}\n\n${BUG_REPORT_CONFIRMATION_REMINDER}`
}

export function serializeDraftToken(payload: unknown): string {
  return `[[BUG_REPORT_DRAFT:${JSON.stringify(payload)}]]`
}
