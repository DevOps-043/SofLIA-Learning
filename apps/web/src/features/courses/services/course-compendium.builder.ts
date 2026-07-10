/**
 * Course Compendium — pure builders (no server/database dependencies, so they
 * can be unit-tested in isolation).
 *
 * Builds the Gemini synthesis prompt and the deterministic per-lesson notes
 * compilation. Length is budgeted at whole-note boundaries because the HTML
 * sanitizer truncates with a raw substring (see html-sanitizer.core).
 */

import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { normalizeGeneratedNoteHtml } from '@/lib/notes/generated-note-html'

import type { LessonNote } from './note.service'
import { escapeHtml } from './lesson-dialogue-transcript.builder'

export interface CompendiumLesson {
  lessonId: string
  lessonTitle: string
  moduleOrder: number
  moduleTitle: string
  orderIndex: number
}

// Prompt input caps: per-note extract length, notes per lesson, global chars.
const PROMPT_EXTRACT_MAX = 1_200
const PROMPT_NOTES_PER_LESSON = 8
const PROMPT_INPUT_MAX = 60_000

interface CompendiumItem {
  detail: string
  label: string
}

interface CourseSynthesisDocument {
  keyConcepts: CompendiumItem[]
  reviewSteps: CompendiumItem[]
  synthesis: string[]
  titles: {
    concepts: string
    index: string
    review: string
    synthesis: string
  }
}

const DEFAULT_SYNTHESIS_TITLES = {
  concepts: 'Conceptos clave',
  index: 'Índice',
  review: 'Guía de repaso',
  synthesis: 'Síntesis del curso',
}

function normalizeModelText(value: unknown, maxLength = 2_500): string {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : ''
}

function toModelRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function toModelStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => normalizeModelText(item))
    .filter(Boolean)
    .slice(0, limit)
}

function toCompendiumItems(value: unknown, limit: number): CompendiumItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): CompendiumItem | null => {
      if (typeof item === 'string') {
        const detail = normalizeModelText(item)
        return detail ? { detail, label: '' } : null
      }
      const record = toModelRecord(item)
      const detail = normalizeModelText(record.detail)
      const label = normalizeModelText(record.label, 140)
      return detail || label ? { detail, label } : null
    })
    .filter((item): item is CompendiumItem => item !== null)
    .slice(0, limit)
}

function parseCourseSynthesisDocument(value: string): CourseSynthesisDocument | null {
  const normalized = value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    const raw: unknown = JSON.parse(normalized)
    const response = toModelRecord(raw)
    const titles = toModelRecord(response.titles)
    const document: CourseSynthesisDocument = {
      keyConcepts: toCompendiumItems(response.keyConcepts, 12),
      reviewSteps: toCompendiumItems(response.reviewSteps, 12),
      synthesis: toModelStringArray(response.synthesis, 5),
      titles: {
        concepts:
          normalizeModelText(titles.concepts, 120) ||
          DEFAULT_SYNTHESIS_TITLES.concepts,
        index:
          normalizeModelText(titles.index, 80) || DEFAULT_SYNTHESIS_TITLES.index,
        review:
          normalizeModelText(titles.review, 120) ||
          DEFAULT_SYNTHESIS_TITLES.review,
        synthesis:
          normalizeModelText(titles.synthesis, 120) ||
          DEFAULT_SYNTHESIS_TITLES.synthesis,
      },
    }

    return document.synthesis.length > 0 &&
      document.keyConcepts.length + document.reviewSteps.length >= 4
      ? document
      : null
  } catch {
    return null
  }
}

function renderCompendiumItems(
  items: CompendiumItem[],
  type: 'ol' | 'ul',
): string {
  return `<${type}>${items
    .map((item) => {
      const label = item.label
        ? `<strong>${escapeHtml(item.label)}${item.detail ? ':' : ''}</strong>`
        : ''
      return `<li>${label}${label && item.detail ? ' ' : ''}${escapeHtml(
        item.detail,
      )}</li>`
    })
    .join('')}</${type}>`
}

export function buildCourseSynthesisHtmlFromModel(value: string): string {
  const document = parseCourseSynthesisDocument(value)

  if (!document) {
    if (value.trim().startsWith('{')) return ''
    return normalizeGeneratedNoteHtml(value, 'course_compendium')
  }

  const { titles } = document
  return normalizeGeneratedNoteHtml(
    [
      `<h2>${escapeHtml(titles.index)}</h2>`,
      `<ol><li>${escapeHtml(titles.synthesis)}</li><li>${escapeHtml(
        titles.concepts,
      )}</li><li>${escapeHtml(titles.review)}</li></ol>`,
      `<h2>${escapeHtml(titles.synthesis)}</h2>`,
      document.synthesis
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join(''),
      `<h2>${escapeHtml(titles.concepts)}</h2>`,
      renderCompendiumItems(document.keyConcepts, 'ul'),
      `<h2>${escapeHtml(titles.review)}</h2>`,
      renderCompendiumItems(document.reviewSteps, 'ol'),
    ].join(''),
    'course_compendium',
  )
}

/**
 * Evidence-only synthesis available immediately when the model is down. The
 * live compendium still returns every source note separately; this preview is
 * deliberately compact so it never hides or replaces the canonical notes.
 */
export function buildDeterministicCourseSynthesisHtml(input: {
  courseTitle: string
  lessons: CompendiumLesson[]
  notesByLesson: Map<string, LessonNote[]>
}): string {
  const modules = new Map<string, CompendiumLesson[]>()
  for (const lesson of input.lessons) {
    const current = modules.get(lesson.moduleTitle) || []
    current.push(lesson)
    modules.set(lesson.moduleTitle, current)
  }

  const allNotes = input.lessons.flatMap(
    (lesson) => input.notesByLesson.get(lesson.lessonId) || [],
  )
  const lessonsWithoutNotes = input.lessons.filter(
    (lesson) => (input.notesByLesson.get(lesson.lessonId) || []).length === 0,
  )
  const moduleHtml = [...modules.entries()]
    .map(([moduleTitle, lessons]) => {
      const items = lessons
        .map((lesson) => {
          const noteCount = (input.notesByLesson.get(lesson.lessonId) || []).length
          return `<li>${escapeHtml(lesson.lessonTitle)}: ${noteCount} apunte${noteCount === 1 ? '' : 's'}</li>`
        })
        .join('')
      return `<h3>${escapeHtml(moduleTitle || 'Módulo')}</h3><ul>${items}</ul>`
    })
    .join('')
  const evidenceItems = allNotes
    .slice(0, 30)
    .map(
      (note) =>
        `<li><strong>${escapeHtml(note.note_title)}</strong>: ${escapeHtml(
          clip(stripHtml(note.note_content), 280),
        )}</li>`,
    )
    .join('')
  const gaps = lessonsWithoutNotes
    .map((lesson) => `<li>${escapeHtml(lesson.lessonTitle)}</li>`)
    .join('')

  return normalizeGeneratedNoteHtml(
    [
      '<h2>Síntesis ejecutiva</h2>',
      `<p>Completaste ${escapeHtml(input.courseTitle)}. Este cuaderno reúne ${allNotes.length} apuntes de ${input.lessons.length} lecciones y conserva sus fuentes para revisarlas y aplicarlas.</p>`,
      '<h2>Resumen por módulo y lección</h2>',
      moduleHtml || '<p><em>No hay temario disponible.</em></p>',
      '<h2>Conceptos y evidencias registradas</h2>',
      evidenceItems
        ? `<ul>${evidenceItems}</ul>`
        : '<p><em>Aún no hay notas fuente.</em></p>',
      '<h2>Brechas para reforzar</h2>',
      gaps
        ? `<p>Estas lecciones no tienen una nota fuente adicional:</p><ul>${gaps}</ul>`
        : '<p>Todas las lecciones tienen evidencia registrada en el cuaderno.</p>',
      '<h2>Plan práctico de 7 días</h2>',
      '<ol><li>Elige tres ideas del cuaderno y explícalas sin consultar el material.</li><li>Aplica una idea a una situación real y registra el resultado.</li><li>Convierte una duda pendiente en una pregunta para SofLIA.</li></ol>',
      '<h2>Plan práctico de 30 días</h2>',
      '<ol><li>Revisa semanalmente las tareas y decisiones registradas.</li><li>Documenta una evidencia de aplicación por semana.</li><li>Al final del periodo, compara resultados y define qué reforzar.</li></ol>',
      '<h2>Preguntas de recuperación</h2>',
      '<ol><li>¿Cuáles son las tres ideas más importantes del curso?</li><li>¿Qué evidencia demuestra que puedo aplicarlas?</li><li>¿Qué decisión o próximo paso surge de lo aprendido?</li></ol>',
    ].join(''),
    'course_compendium',
  )
}

export function clip(value: string | null | undefined, maxLength: number): string {
  const normalized = (value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}...`
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

export function groupNotesByLesson(notes: LessonNote[]): Map<string, LessonNote[]> {
  const byLesson = new Map<string, LessonNote[]>()
  for (const note of notes) {
    if (note.source_type === 'course_compendium') continue
    const list = byLesson.get(note.lesson_id) || []
    list.push(note)
    byLesson.set(note.lesson_id, list)
  }
  return byLesson
}

/** Auto-notes first (they already summarize the lesson), then most recent. */
function sortNotesForPriority(notes: LessonNote[]): LessonNote[] {
  return [...notes].sort((a, b) => {
    const aAuto = a.source_type === 'lesson_auto_note' ? 0 : 1
    const bAuto = b.source_type === 'lesson_auto_note' ? 0 : 1
    if (aAuto !== bAuto) return aAuto - bAuto
    return (b.updated_at || '').localeCompare(a.updated_at || '')
  })
}

export function buildCourseCompendiumPrompt(input: {
  courseTitle: string
  lessons: CompendiumLesson[]
  notesByLesson: Map<string, LessonNote[]>
}): string {
  const outline = input.lessons
    .map(
      (lesson) =>
        `- ${lesson.moduleTitle ? `${lesson.moduleTitle} / ` : ''}${lesson.lessonTitle}`,
    )
    .join('\n')

  const extracts: string[] = []
  let extractsLength = 0

  for (const lesson of input.lessons) {
    const notes = sortNotesForPriority(
      input.notesByLesson.get(lesson.lessonId) || [],
    ).slice(0, PROMPT_NOTES_PER_LESSON)

    for (const note of notes) {
      const extract = `Lección "${lesson.lessonTitle}" — ${note.note_title}: ${clip(stripHtml(note.note_content), PROMPT_EXTRACT_MAX)}`
      if (extractsLength + extract.length > PROMPT_INPUT_MAX) break
      extracts.push(extract)
      extractsLength += extract.length
    }
    if (extractsLength >= PROMPT_INPUT_MAX) break
  }

  return `Genera la síntesis de estudio de un curso completado en SofLIA Learning.

Objetivo:
El usuario acaba de completar el curso. Crea una guía de estudio que le ayude a reforzar y repasar todo lo aprendido, basada en sus apuntes.

Reglas estrictas:
- Responde unicamente con JSON valido que respete exactamente el esquema indicado abajo.
- No uses HTML, markdown, bloques de codigo, estilos, tablas ni enlaces inventados dentro de los textos.
- No inventes datos. Sintetiza solo a partir del temario y los apuntes disponibles.
- Escribe de 2 a 4 parrafos breves en synthesis.
- Incluye de 5 a 10 conceptos en keyConcepts y de 5 a 10 pasos accionables en reviewSteps cuando haya contexto suficiente.
- Usa label para nombrar el concepto o la accion y detail para explicarlo con precision.
- Mantente entre 600 y 1200 palabras.
- Tono profesional, claro y accionable.
- Idioma: usa el idioma principal del contenido; si no es claro, usa español. Traduce tambien todos los valores de titles a ese idioma.

Esquema JSON obligatorio:
{
  "titles": {
    "index": "Índice",
    "synthesis": "Síntesis del curso",
    "concepts": "Conceptos clave",
    "review": "Guía de repaso"
  },
  "synthesis": ["párrafo"],
  "keyConcepts": [{ "label": "concepto", "detail": "explicación" }],
  "reviewSteps": [{ "label": "acción", "detail": "cómo aplicarla" }]
}

Curso: ${input.courseTitle}

Temario (módulos y lecciones en orden):
${outline || 'Sin temario disponible.'}

Apuntes del usuario (extractos):
${extracts.length > 0 ? extracts.join('\n\n') : 'El usuario no tiene apuntes registrados; genera la síntesis a partir del temario.'}`
}

/**
 * Compiles the user's notes per lesson as safe HTML within `budget` chars.
 * Appends whole notes only; notes that do not fit are listed by title under a
 * visible notice (never cut mid-tag).
 */
export function buildCompiledNotesHtml(input: {
  budget: number
  lessons: CompendiumLesson[]
  notesByLesson: Map<string, LessonNote[]>
}): string {
  const heading = '<h2>Mis apuntes por lección</h2>'
  const parts: string[] = []
  const omitted: string[] = []
  let used = heading.length

  for (const lesson of input.lessons) {
    const notes = sortNotesForPriority(input.notesByLesson.get(lesson.lessonId) || [])
    if (notes.length === 0) continue

    const lessonHeading = `<h3>${escapeHtml(lesson.lessonTitle)}</h3>`
    let lessonHeadingAppended = false

    for (const note of notes) {
      const noteHtml = `<h4>${escapeHtml(note.note_title)}</h4>${sanitizeHtml(
        note.note_content,
        { level: 'rich' },
      )}`
      const headingCost = lessonHeadingAppended ? 0 : lessonHeading.length

      if (used + headingCost + noteHtml.length > input.budget) {
        omitted.push(`${note.note_title} — ${lesson.lessonTitle}`)
        continue
      }

      if (!lessonHeadingAppended) {
        parts.push(lessonHeading)
        used += lessonHeading.length
        lessonHeadingAppended = true
      }
      parts.push(noteHtml)
      used += noteHtml.length
    }
  }

  if (parts.length === 0 && omitted.length === 0) {
    return `${heading}<p><em>No se encontraron apuntes para este curso. Crea apuntes desde las lecciones o el libro de apuntes y regenera el compendio.</em></p>`
  }

  let html = `${heading}${parts.join('')}`

  if (omitted.length > 0) {
    // Cap the listing so it can never blow past the note-size limit itself.
    const omittedItems = omitted
      .slice(0, 30)
      .map((title) => `<li>${escapeHtml(clip(title, 160))}</li>`)
      .join('')
    html += `<p><em>Los siguientes apuntes no se incluyeron completos por longitud; consúltalos en tu libro de apuntes.</em></p><ul>${omittedItems}</ul>`
  }

  return html
}
