import {
  extractMentionIdentifiers,
  findMentionedEntities,
  mentionsVocabulary,
  toMentionableEntry,
} from '../admin-lookup-shared/mention-matching'
import type {
  OrganizationCatalogEntry,
  OrganizationLookupIdentifiers,
} from './types'

/**
 * Detección de la organización sobre la que pregunta el administrador.
 *
 * Es una capa fina sobre las primitivas de `../admin-lookup-shared`: aquí solo
 * vive lo específico de organizaciones (qué columnas se usan como término de
 * búsqueda y qué vocabulario denota una pregunta sobre empresas).
 */

export {
  mentionsTerm,
  normalizeForMention,
} from '../admin-lookup-shared/mention-matching'

/**
 * Extrae los identificadores de organización presentes en los mensajes.
 *
 * @param recentUserMessages Mensajes del rol "user" en orden cronológico
 *   (el último elemento es el mensaje actual).
 */
export function extractOrganizationIdentifiers(
  recentUserMessages: string[],
): OrganizationLookupIdentifiers {
  return extractMentionIdentifiers(recentUserMessages)
}

/** Organizaciones del catálogo mencionadas, por nombre o por slug. */
export function findMentionedOrganizations(
  identifiers: OrganizationLookupIdentifiers,
  catalog: OrganizationCatalogEntry[],
): OrganizationCatalogEntry[] {
  return findMentionedEntities(
    identifiers,
    catalog.map((entry) => toMentionableEntry(entry.id, [entry.name, entry.slug], entry)),
  )
}

export function hasOrganizationMention(
  identifiers: OrganizationLookupIdentifiers,
  catalog: OrganizationCatalogEntry[],
): boolean {
  return findMentionedOrganizations(identifiers, catalog).length > 0
}

/**
 * Vocabulario que indica una pregunta sobre organizaciones sin nombrar ninguna
 * ("¿cuántas empresas hay?", "¿qué cliente tiene más usuarios?").
 *
 * Decide si merece la pena construir el índice comparativo de la plataforma, que
 * es la consulta más cara del módulo. Sin este filtro se recorrerían las
 * membresías de todas las empresas en CADA turno del superadmin, incluidas las
 * preguntas que nada tienen que ver con organizaciones.
 */
const ORGANIZATION_VOCABULARY = [
  'organizacion',
  'organizaciones',
  'empresa',
  'empresas',
  'compania',
  'companias',
  'cliente',
  'clientes',
  'cuenta',
  'cuentas',
  'tenant',
  'tenants',
  'licencia',
  'licencias',
  'suscripcion',
  'suscripciones',
  'plan',
  'planes',
]

export function mentionsOrganizationVocabulary(
  recentUserMessages: string[],
): boolean {
  return mentionsVocabulary(recentUserMessages, ORGANIZATION_VOCABULARY)
}
