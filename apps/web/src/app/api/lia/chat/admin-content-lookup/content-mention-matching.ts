import {
  extractMentionIdentifiers,
  findMentionedEntities,
  mentionsVocabulary,
  toMentionableEntry,
} from '../admin-lookup-shared/mention-matching'
import type {
  ContentCatalog,
  ContentLookupIdentifiers,
  CourseCatalogEntry,
  LearningPathCatalogEntry,
} from './types'

/**
 * Detección del curso o la ruta sobre la que pregunta el administrador.
 *
 * Capa fina sobre las primitivas de `../admin-lookup-shared`: aquí solo vive lo
 * específico de contenido (qué columnas son término de búsqueda y qué
 * vocabulario denota una pregunta sobre el catálogo).
 */

export interface MentionedContent {
  courses: CourseCatalogEntry[]
  learningPaths: LearningPathCatalogEntry[]
}

export function extractContentIdentifiers(
  recentUserMessages: string[],
): ContentLookupIdentifiers {
  return extractMentionIdentifiers(recentUserMessages)
}

/**
 * Cursos y rutas mencionados.
 *
 * Se resuelven en la MISMA pasada sobre un único catálogo mixto, no en dos
 * pasadas independientes: si una ruta y un curso comparten nombre, gana la
 * coincidencia más específica en lugar de aparecer los dos.
 */
export function findMentionedContent(
  identifiers: ContentLookupIdentifiers,
  catalog: ContentCatalog,
): MentionedContent {
  type CatalogItem =
    | { kind: 'course'; entry: CourseCatalogEntry }
    | { kind: 'learning-path'; entry: LearningPathCatalogEntry }

  const entries = [
    ...catalog.courses.map((entry) =>
      toMentionableEntry<CatalogItem>(entry.id, [entry.title, entry.slug], {
        kind: 'course',
        entry,
      }),
    ),
    ...catalog.learningPaths.map((entry) =>
      toMentionableEntry<CatalogItem>(entry.id, [entry.title, entry.slug], {
        kind: 'learning-path',
        entry,
      }),
    ),
  ]

  const matched = findMentionedEntities(identifiers, entries)

  return {
    courses: matched
      .filter((item): item is Extract<CatalogItem, { kind: 'course' }> =>
        item.kind === 'course',
      )
      .map((item) => item.entry),
    learningPaths: matched
      .filter((item): item is Extract<CatalogItem, { kind: 'learning-path' }> =>
        item.kind === 'learning-path',
      )
      .map((item) => item.entry),
  }
}

export function countMentionedContent(mentioned: MentionedContent): number {
  return mentioned.courses.length + mentioned.learningPaths.length
}

/**
 * Vocabulario que indica una pregunta sobre el catálogo sin nombrar nada
 * ("¿qué cursos hay?", "¿cuántas lecciones tiene el catálogo?").
 *
 * Decide si construir el índice de catálogo, que solo existe para el superadmin.
 */
const CONTENT_VOCABULARY = [
  'curso',
  'cursos',
  'leccion',
  'lecciones',
  'modulo',
  'modulos',
  'ruta',
  'rutas',
  'catalogo',
  'contenido',
  'contenidos',
  'actividad',
  'actividades',
  'quiz',
  'quizzes',
  'temario',
  'material',
  'materiales',
  'certificado',
  'certificados',
]

export function mentionsContentVocabulary(recentUserMessages: string[]): boolean {
  return mentionsVocabulary(recentUserMessages, CONTENT_VOCABULARY)
}
