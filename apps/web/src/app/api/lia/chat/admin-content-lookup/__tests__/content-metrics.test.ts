import { describe, expect, it } from 'vitest'
import {
  analyzeCourseDropoff,
  summarizeCourseAdoption,
  summarizeCourseOrganizations,
  summarizeCourseStructure,
  type ActivityRow,
  type EnrollmentRow,
  type LessonProgressRow,
  type LessonRow,
  type ModuleRow,
} from '../content-metrics'

const MODULES: ModuleRow[] = [
  {
    moduleId: 'm1',
    title: 'Fundamentos',
    orderIndex: 1,
    isPublished: true,
    isRequired: true,
    durationMinutes: 60,
  },
  {
    moduleId: 'm2',
    title: 'Práctica',
    orderIndex: 2,
    isPublished: false,
    isRequired: false,
    durationMinutes: 30,
  },
]

const LESSONS: LessonRow[] = [
  { lessonId: 'l1', moduleId: 'm1', title: 'Intro', orderIndex: 1, durationMinutes: 20, isPublished: true },
  { lessonId: 'l2', moduleId: 'm1', title: 'Conceptos', orderIndex: 2, durationMinutes: 25, isPublished: true },
  { lessonId: 'l3', moduleId: 'm2', title: 'Taller', orderIndex: 1, durationMinutes: 30, isPublished: false },
]

function enrollment(overrides: Partial<EnrollmentRow> = {}): EnrollmentRow {
  return {
    userId: 'u1',
    organizationId: 'org-1',
    status: 'active',
    progressPercentage: 50,
    enrolledAt: '2026-02-01T00:00:00.000Z',
    completedAt: null,
    lastAccessedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('summarizeCourseStructure', () => {
  it('cuenta módulos, lecciones y actividades por tipo', () => {
    const activities: ActivityRow[] = [
      { lessonId: 'l1', activityType: 'reflection' },
      { lessonId: 'l1', activityType: 'quiz' },
      { lessonId: 'l2', activityType: 'quiz' },
    ]

    const structure = summarizeCourseStructure({
      modules: MODULES,
      lessons: LESSONS,
      activities,
      truncated: false,
    })

    expect(structure.totalModules).toBe(2)
    expect(structure.totalLessons).toBe(3)
    expect(structure.publishedLessons).toBe(2)
    expect(structure.totalActivities).toBe(3)
    expect(structure.activitiesByType).toEqual([
      { type: 'quiz', count: 2 },
      { type: 'reflection', count: 1 },
    ])
    expect(structure.totalDurationMinutes).toBe(75)
  })

  it('asocia cada lección a su módulo y respeta el orden', () => {
    const structure = summarizeCourseStructure({
      modules: MODULES,
      lessons: LESSONS,
      activities: [],
      truncated: false,
    })

    expect(structure.modules.map((module) => module.title)).toEqual([
      'Fundamentos',
      'Práctica',
    ])
    expect(structure.modules[0].lessonCount).toBe(2)
    expect(structure.modules[1].lessonCount).toBe(1)
  })
})

describe('summarizeCourseAdoption', () => {
  it('calcula la tasa de finalización sobre personas, no sobre inscripciones', () => {
    const adoption = summarizeCourseAdoption({
      enrollments: [
        enrollment({ userId: 'u1', progressPercentage: 100, completedAt: '2026-05-01T00:00:00.000Z' }),
        enrollment({ userId: 'u2', progressPercentage: 20 }),
        enrollment({ userId: 'u3', progressPercentage: 0 }),
        enrollment({ userId: 'u4', progressPercentage: 60, status: 'completed' }),
      ],
      certificatesIssued: 2,
      truncated: false,
    })

    expect(adoption.enrolledUsers).toBe(4)
    expect(adoption.completedUsers).toBe(2)
    expect(adoption.completionRatePercentage).toBe(50)
    expect(adoption.averageProgressPercentage).toBe(45)
    expect(adoption.certificatesIssued).toBe(2)
  })

  it('no divide entre cero cuando no hay inscripciones', () => {
    const adoption = summarizeCourseAdoption({
      enrollments: [],
      certificatesIssued: 0,
      truncated: false,
    })

    expect(adoption.enrolledUsers).toBe(0)
    expect(adoption.completionRatePercentage).toBe(0)
    expect(adoption.averageProgressPercentage).toBe(0)
  })

  it('conserva la primera inscripción y el último acceso', () => {
    const adoption = summarizeCourseAdoption({
      enrollments: [
        enrollment({ enrolledAt: '2026-06-01T00:00:00.000Z', lastAccessedAt: '2026-06-02T00:00:00.000Z' }),
        enrollment({ enrolledAt: '2026-01-01T00:00:00.000Z', lastAccessedAt: '2026-07-30T00:00:00.000Z' }),
      ],
      certificatesIssued: 0,
      truncated: false,
    })

    expect(adoption.firstEnrollmentAt).toBe('2026-01-01T00:00:00.000Z')
    expect(adoption.lastAccessedAt).toBe('2026-07-30T00:00:00.000Z')
  })
})

describe('summarizeCourseOrganizations', () => {
  it('agrupa por empresa y resuelve el nombre real', () => {
    const usage = summarizeCourseOrganizations({
      enrollments: [
        enrollment({ userId: 'u1', organizationId: 'org-1', progressPercentage: 80 }),
        enrollment({ userId: 'u2', organizationId: 'org-1', progressPercentage: 40 }),
        enrollment({ userId: 'u3', organizationId: 'org-2', progressPercentage: 10 }),
      ],
      organizationNamesById: new Map([
        ['org-1', 'Acme'],
        ['org-2', 'Globex'],
      ]),
    })

    expect(usage).toEqual([
      { organizationName: 'Acme', enrolledUsers: 2, averageProgressPercentage: 60 },
      { organizationName: 'Globex', enrolledUsers: 1, averageProgressPercentage: 10 },
    ])
  })

  it('ignora inscripciones sin organización', () => {
    const usage = summarizeCourseOrganizations({
      enrollments: [enrollment({ organizationId: null })],
      organizationNamesById: new Map(),
    })

    expect(usage).toEqual([])
  })
})

describe('analyzeCourseDropoff', () => {
  function progressFor(lessonId: string, userIds: string[], completedIds: string[] = []) {
    return userIds.map<LessonProgressRow>((userId) => ({
      lessonId,
      userId,
      startedAt: '2026-03-01T00:00:00.000Z',
      isCompleted: completedIds.includes(userId),
    }))
  }

  it('ordena las lecciones por módulo y posición', () => {
    const dropoff = analyzeCourseDropoff({
      modules: MODULES,
      lessons: LESSONS,
      activities: [],
      progress: [],
    })

    expect(dropoff.lessons.map((lesson) => lesson.title)).toEqual([
      'Intro',
      'Conceptos',
      'Taller',
    ])
  })

  it('señala la lección con la mayor caída de participación', () => {
    const dropoff = analyzeCourseDropoff({
      modules: MODULES,
      lessons: LESSONS,
      activities: [],
      progress: [
        ...progressFor('l1', ['u1', 'u2', 'u3', 'u4', 'u5'], ['u1', 'u2', 'u3', 'u4']),
        ...progressFor('l2', ['u1', 'u2', 'u3', 'u4']),
        ...progressFor('l3', ['u1']),
      ],
    })

    expect(dropoff.bottleneckLessonTitle).toBe('Taller')
    expect(dropoff.bottleneckDropPercentage).toBe(75)
    expect(dropoff.lessons[0].usersStarted).toBe(5)
    expect(dropoff.lessons[0].usersCompleted).toBe(4)
  })

  it('no señala cuello de botella con muestras minúsculas', () => {
    const dropoff = analyzeCourseDropoff({
      modules: MODULES,
      lessons: LESSONS,
      activities: [],
      progress: [...progressFor('l1', ['u1', 'u2']), ...progressFor('l2', [])],
    })

    expect(dropoff.bottleneckLessonTitle).toBeNull()
    expect(dropoff.bottleneckDropPercentage).toBeNull()
  })

  it('no señala nada cuando la participación no cae', () => {
    const dropoff = analyzeCourseDropoff({
      modules: MODULES,
      lessons: LESSONS,
      activities: [],
      progress: [
        ...progressFor('l1', ['u1', 'u2', 'u3']),
        ...progressFor('l2', ['u1', 'u2', 'u3']),
        ...progressFor('l3', ['u1', 'u2', 'u3']),
      ],
    })

    expect(dropoff.bottleneckLessonTitle).toBeNull()
  })

  it('cuenta las actividades de cada lección', () => {
    const dropoff = analyzeCourseDropoff({
      modules: MODULES,
      lessons: LESSONS,
      activities: [
        { lessonId: 'l1', activityType: 'quiz' },
        { lessonId: 'l1', activityType: 'reflection' },
      ],
      progress: [],
    })

    expect(dropoff.lessons[0].activityCount).toBe(2)
    expect(dropoff.lessons[1].activityCount).toBe(0)
  })
})
