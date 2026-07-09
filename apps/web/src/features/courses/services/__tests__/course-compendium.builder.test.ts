import { describe, expect, it } from 'vitest'

import {
  buildCompiledNotesHtml,
  buildCourseCompendiumPrompt,
  type CompendiumLesson,
} from '../course-compendium.builder'
import type { LessonNote } from '../note.service'

function makeLesson(overrides: Partial<CompendiumLesson> = {}): CompendiumLesson {
  return {
    lessonId: 'l1',
    lessonTitle: 'Lección 1',
    moduleOrder: 1,
    moduleTitle: 'Módulo 1',
    orderIndex: 1,
    ...overrides,
  }
}

function makeNote(overrides: Partial<LessonNote> = {}): LessonNote {
  return {
    note_id: 'n1',
    note_title: 'Apunte',
    note_content: '<p>Contenido</p>',
    note_tags: [],
    is_auto_generated: false,
    source_type: 'manual',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    user_id: 'u1',
    lesson_id: 'l1',
    enrollment_id: null,
    organization_id: null,
    ...overrides,
  }
}

describe('buildCourseCompendiumPrompt', () => {
  it('includes the course outline and note extracts', () => {
    const prompt = buildCourseCompendiumPrompt({
      courseTitle: 'IA para equipos',
      lessons: [makeLesson()],
      notesByLesson: new Map([
        ['l1', [makeNote({ note_content: '<p>Concepto clave de IA</p>' })]],
      ]),
    })

    expect(prompt).toContain('IA para equipos')
    expect(prompt).toContain('Módulo 1 / Lección 1')
    expect(prompt).toContain('Concepto clave de IA')
    expect(prompt).toContain('<h2>Síntesis del curso</h2>')
  })

  it('handles the no-notes case with an explicit instruction', () => {
    const prompt = buildCourseCompendiumPrompt({
      courseTitle: 'Curso',
      lessons: [makeLesson()],
      notesByLesson: new Map(),
    })

    expect(prompt).toContain('no tiene apuntes registrados')
  })
})

describe('buildCompiledNotesHtml', () => {
  it('compiles notes per lesson with escaped headings', () => {
    const html = buildCompiledNotesHtml({
      budget: 10_000,
      lessons: [makeLesson({ lessonTitle: 'Intro <b>x</b>' })],
      notesByLesson: new Map([
        ['l1', [makeNote({ note_title: 'Nota & detalle' })]],
      ]),
    })

    expect(html).toContain('<h2>Mis apuntes por lección</h2>')
    expect(html).toContain('<h3>Intro &lt;b&gt;x&lt;/b&gt;</h3>')
    expect(html).toContain('<h4>Nota &amp; detalle</h4>')
    expect(html).toContain('<p>Contenido</p>')
  })

  it('lists notes that do not fit the budget instead of cutting them', () => {
    const bigNote = makeNote({
      note_id: 'big',
      note_title: 'Nota grande',
      note_content: `<p>${'x'.repeat(500)}</p>`,
    })
    const html = buildCompiledNotesHtml({
      budget: 200,
      lessons: [makeLesson()],
      notesByLesson: new Map([['l1', [bigNote]]]),
    })

    expect(html).toContain('no se incluyeron completos por longitud')
    expect(html).toContain('<li>Nota grande — Lección 1</li>')
    expect(html).not.toContain('xxxxx')
  })

  it('renders an empty-notes notice when there is nothing to compile', () => {
    const html = buildCompiledNotesHtml({
      budget: 10_000,
      lessons: [makeLesson()],
      notesByLesson: new Map(),
    })

    expect(html).toContain('No se encontraron apuntes para este curso')
  })

  it('prioritizes auto-notes before manual notes within a lesson', () => {
    const html = buildCompiledNotesHtml({
      budget: 10_000,
      lessons: [makeLesson()],
      notesByLesson: new Map([
        [
          'l1',
          [
            makeNote({ note_id: 'manual', note_title: 'Manual' }),
            makeNote({
              note_id: 'auto',
              note_title: 'Automática',
              source_type: 'lesson_auto_note',
              is_auto_generated: true,
            }),
          ],
        ],
      ]),
    })

    expect(html.indexOf('Automática')).toBeLessThan(html.indexOf('Manual'))
  })
})
