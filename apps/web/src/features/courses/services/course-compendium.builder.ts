/**
 * Course Compendium — pure builders (no server/database dependencies, so they
 * can be unit-tested in isolation).
 *
 * Builds the Gemini synthesis prompt and the deterministic per-lesson notes
 * compilation. Length is budgeted at whole-note boundaries because the HTML
 * sanitizer truncates with a raw substring (see html-sanitizer.core).
 */

import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'

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
- Responde unicamente con HTML seguro: usa <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>.
- No uses markdown, bloques de codigo, estilos inline, scripts, tablas ni enlaces inventados.
- No inventes datos. Sintetiza solo a partir del temario y los apuntes disponibles.
- Mantente entre 600 y 1200 palabras.
- Tono profesional, claro y accionable.
- Idioma: usa el idioma principal del contenido; si no es claro, usa español.

Estructura obligatoria:
<h2>Síntesis del curso</h2>
<h2>Conceptos clave</h2>
<h2>Guía de repaso</h2>

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
