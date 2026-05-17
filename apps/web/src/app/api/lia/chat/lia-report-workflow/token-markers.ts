import type { ExtractedToken } from './types'
import { parseJsonPayload } from './parsing'

export const BUG_REPORT_DRAFT_REGEX = /\[\[BUG_REPORT_DRAFT:(\{[\s\S]*?\})\]\]/
export const BUG_REPORT_REGEX = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/

const CONFIRMATION_REMINDER =
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

export function stripTokenMarkers(content: string): string {
  return content
    .replace(BUG_REPORT_DRAFT_REGEX, '')
    .replace(BUG_REPORT_REGEX, '')
    .trim()
}

export function ensureConfirmationPrompt(content: string): string {
  const alreadyRequestsConfirmation =
    /confirmas|esta correcto|está correcto|quieres que lo envie|quieres que lo envíe|puedo enviarlo/i.test(content)

  if (!content.trim()) return CONFIRMATION_REMINDER
  if (alreadyRequestsConfirmation) return content.trim()

  return `${content.trim()}\n\n${CONFIRMATION_REMINDER}`
}

export function serializeDraftToken(payload: unknown): string {
  return `[[BUG_REPORT_DRAFT:${JSON.stringify(payload)}]]`
}
