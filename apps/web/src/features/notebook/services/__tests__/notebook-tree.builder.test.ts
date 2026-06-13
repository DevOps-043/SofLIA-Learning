import { describe, expect, it } from 'vitest'

import {
  buildNotebookTree,
  toNoteDetail,
  type DetailRow,
  type TreeNoteRow,
} from '../notebook-tree.builder'

function makeRow(overrides: {
  noteId: string
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  moduleOrder?: number
  lessonOrder?: number
  updatedAt?: string
  tags?: unknown
  source?: string | null
}): TreeNoteRow {
  return {
    note_id: overrides.noteId,
    note_title: `Title ${overrides.noteId}`,
    note_tags: overrides.tags ?? [],
    source_type: overrides.source ?? 'manual',
    is_auto_generated: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: overrides.updatedAt ?? '2026-01-01T00:00:00Z',
    course_lessons: {
      lesson_id: overrides.lessonId,
      lesson_title: overrides.lessonTitle,
      lesson_order_index: overrides.lessonOrder ?? 1,
      course_modules: {
        course_id: overrides.courseId,
        module_order_index: overrides.moduleOrder ?? 1,
        courses: {
          id: overrides.courseId,
          title: overrides.courseTitle,
          slug: overrides.courseTitle.toLowerCase(),
        },
      },
    },
  }
}

describe('buildNotebookTree', () => {
  it('groups notes by course then lesson and counts totals', () => {
    const tree = buildNotebookTree([
      makeRow({
        noteId: 'n1',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l1',
        lessonTitle: 'Lesson 1',
      }),
      makeRow({
        noteId: 'n2',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l1',
        lessonTitle: 'Lesson 1',
      }),
      makeRow({
        noteId: 'n3',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l2',
        lessonTitle: 'Lesson 2',
      }),
    ])

    expect(tree.totalNotes).toBe(3)
    expect(tree.courses).toHaveLength(1)
    expect(tree.courses[0].courseId).toBe('c1')
    expect(tree.courses[0].totalNotes).toBe(3)
    expect(tree.courses[0].lessons).toHaveLength(2)
    expect(tree.courses[0].lessons[0].notes).toHaveLength(2)
    expect(tree.courses[0].lessons[1].notes).toHaveLength(1)
  })

  it('orders courses alphabetically and lessons by module then lesson order', () => {
    const tree = buildNotebookTree([
      makeRow({
        noteId: 'n1',
        courseId: 'c2',
        courseTitle: 'Zeta',
        lessonId: 'l2',
        lessonTitle: 'Second',
        moduleOrder: 2,
        lessonOrder: 1,
      }),
      makeRow({
        noteId: 'n2',
        courseId: 'c2',
        courseTitle: 'Zeta',
        lessonId: 'l1',
        lessonTitle: 'First',
        moduleOrder: 1,
        lessonOrder: 1,
      }),
      makeRow({
        noteId: 'n3',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l3',
        lessonTitle: 'Solo',
      }),
    ])

    expect(tree.courses.map((course) => course.title)).toEqual(['Alpha', 'Zeta'])
    const zeta = tree.courses.find((course) => course.courseId === 'c2')!
    expect(zeta.lessons.map((lesson) => lesson.title)).toEqual([
      'First',
      'Second',
    ])
  })

  it('skips rows missing course/lesson relations', () => {
    const orphan: TreeNoteRow = {
      note_id: 'orphan',
      note_title: 'Orphan',
      note_tags: [],
      source_type: 'manual',
      is_auto_generated: false,
      created_at: null,
      updated_at: null,
      course_lessons: null,
    }
    const tree = buildNotebookTree([
      orphan,
      makeRow({
        noteId: 'n1',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l1',
        lessonTitle: 'Lesson 1',
      }),
    ])

    expect(tree.totalNotes).toBe(1)
    expect(tree.courses).toHaveLength(1)
  })

  it('normalizes tags and source type', () => {
    const tree = buildNotebookTree([
      makeRow({
        noteId: 'n1',
        courseId: 'c1',
        courseTitle: 'Alpha',
        lessonId: 'l1',
        lessonTitle: 'Lesson 1',
        tags: ['a', 2, 'b', null],
        source: 'weird-source',
      }),
    ])

    const note = tree.courses[0].lessons[0].notes[0]
    expect(note.tags).toEqual(['a', 'b'])
    expect(note.source).toBe('manual')
  })
})

describe('toNoteDetail', () => {
  it('maps nested course/lesson fields into a flat detail', () => {
    const row: DetailRow = {
      note_id: 'n1',
      note_title: 'Title',
      note_content: '<p>Hello</p>',
      note_tags: ['x'],
      source_type: 'chat',
      is_auto_generated: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      user_id: 'u1',
      lesson_id: 'l1',
      organization_id: 'org1',
      course_lessons: {
        lesson_id: 'l1',
        lesson_title: 'Lesson 1',
        course_modules: {
          course_id: 'c1',
          courses: { id: 'c1', title: 'Alpha', slug: 'alpha' },
        },
      },
    }

    const detail = toNoteDetail(row)

    expect(detail).toMatchObject({
      noteId: 'n1',
      content: '<p>Hello</p>',
      tags: ['x'],
      source: 'chat',
      isAutoGenerated: true,
      lessonId: 'l1',
      lessonTitle: 'Lesson 1',
      courseId: 'c1',
      courseTitle: 'Alpha',
      courseSlug: 'alpha',
    })
  })
})
