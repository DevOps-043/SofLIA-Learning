import type { ExtractedToken } from './types'
import { parseJsonPayload } from './parsing'

export const BUG_REPORT_DRAFT_REGEX = /\[\[BUG_REPORT_DRAFT:(\{[\s\S]*?\})\]\]/
export const BUG_REPORT_REGEX = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/

export const BUG_REPORT_CONFIRMATION_REMINDER =
  'Confirmas que este reporte tecnico quedo correcto para enviarlo al equipo? Si algo no refleja bien el problema, dime que ajustar.'

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
    .trim()
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
