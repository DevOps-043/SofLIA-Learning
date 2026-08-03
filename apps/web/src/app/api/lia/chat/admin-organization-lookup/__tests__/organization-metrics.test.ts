import { describe, expect, it } from 'vitest'
import {
  rankMemberPerformance,
  summarizeCourseAdoption,
  summarizeFirstLessonStarts,
  summarizeMembers,
  type EnrollmentRow,
} from '../organization-metrics'
import type { OrganizationMember } from '../types'

const NOW = new Date('2026-08-03T12:00:00.000Z').getTime()

function member(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    userId: 'user-1',
    name: 'Ana Pérez',
    email: 'ana@empresa.com',
    role: 'member',
    status: 'active',
    jobTitle: 'Analista',
    joinedAt: '2026-01-10T00:00:00.000Z',
    lastActivityAt: '2026-08-01T00:00:00.000Z',
    lastLoginAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

function enrollment(overrides: Partial<EnrollmentRow> = {}): EnrollmentRow {
  return {
    userId: 'user-1',
    courseTitle: 'Fundamentos de IA',
    status: 'active',
    progressPercentage: 50,
    enrolledAt: '2026-02-01T00:00:00.000Z',
    completedAt: null,
    lastAccessedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('summarizeMembers', () => {
  it('cuenta estados, roles y consumo de licencias', () => {
    const summary = summarizeMembers({
      members: [
        member({ userId: 'u1', role: 'owner' }),
        member({ userId: 'u2', role: 'admin' }),
        member({ userId: 'u3', status: 'invited', lastActivityAt: null, lastLoginAt: null }),
        member({ userId: 'u4', status: 'suspended' }),
      ],
      licenseLimit: 200,
      truncated: false,
      now: NOW,
    })

    expect(summary.totalMembers).toBe(4)
    expect(summary.activeMembers).toBe(2)
    expect(summary.invitedMembers).toBe(1)
    expect(summary.suspendedMembers).toBe(1)
    expect(summary.owners).toBe(1)
    expect(summary.admins).toBe(1)
    expect(summary.licenseUsagePercentage).toBe(1)
  })

  it('clasifica la actividad reciente de los miembros activos', () => {
    const summary = summarizeMembers({
      members: [
        member({ userId: 'u1', lastActivityAt: '2026-08-02T00:00:00.000Z' }),
        member({ userId: 'u2', lastActivityAt: '2026-07-20T00:00:00.000Z' }),
        member({ userId: 'u3', lastActivityAt: '2026-01-01T00:00:00.000Z' }),
        member({ userId: 'u4', lastActivityAt: null, lastLoginAt: null }),
      ],
      licenseLimit: null,
      truncated: false,
      now: NOW,
    })

    expect(summary.activeLast7Days).toBe(1)
    expect(summary.activeLast30Days).toBe(2)
    expect(summary.neverActive).toBe(1)
    expect(summary.licenseUsagePercentage).toBeNull()
  })

  it('ordena las altas recientes de más nueva a más antigua', () => {
    const summary = summarizeMembers({
      members: [
        member({ userId: 'u1', name: 'Antigua', joinedAt: '2026-01-01T00:00:00.000Z' }),
        member({ userId: 'u2', name: 'Nueva', joinedAt: '2026-07-01T00:00:00.000Z' }),
      ],
      licenseLimit: 10,
      truncated: false,
      now: NOW,
    })

    expect(summary.recentJoins.map((join) => join.name)).toEqual(['Nueva', 'Antigua'])
  })
})

describe('summarizeFirstLessonStarts', () => {
  it('toma el primer inicio de cada persona y reparte por mes', () => {
    const result = summarizeFirstLessonStarts({
      rows: [
        { userId: 'u1', startedAt: '2026-03-05T10:00:00.000Z' },
        { userId: 'u1', startedAt: '2026-04-05T10:00:00.000Z' },
        { userId: 'u2', startedAt: '2026-03-20T10:00:00.000Z' },
        { userId: 'u3', startedAt: '2026-06-01T10:00:00.000Z' },
      ],
      truncated: false,
    })

    expect(result.usersWithStart).toBe(3)
    expect(result.earliestAt).toBe('2026-03-05T10:00:00.000Z')
    expect(result.latestAt).toBe('2026-06-01T10:00:00.000Z')
    expect(result.medianAt).toBe('2026-03-20T10:00:00.000Z')
    expect(result.monthlyDistribution).toEqual([
      { month: '2026-03', users: 2 },
      { month: '2026-06', users: 1 },
    ])
  })

  it('ignora filas sin fecha válida', () => {
    const result = summarizeFirstLessonStarts({
      rows: [
        { userId: 'u1', startedAt: null },
        { userId: 'u2', startedAt: 'no-es-una-fecha' },
      ],
      truncated: false,
    })

    expect(result.usersWithStart).toBe(0)
    expect(result.medianAt).toBeNull()
    expect(result.monthlyDistribution).toEqual([])
  })

  it('propaga el aviso de truncamiento', () => {
    const result = summarizeFirstLessonStarts({
      rows: [{ userId: 'u1', startedAt: '2026-03-05T10:00:00.000Z' }],
      truncated: true,
    })

    expect(result.truncated).toBe(true)
  })
})

describe('summarizeCourseAdoption', () => {
  it('agrega por curso y ordena por número de inscritos', () => {
    const adoption = summarizeCourseAdoption([
      enrollment({ userId: 'u1', courseTitle: 'IA Aplicada', progressPercentage: 100, completedAt: '2026-05-01T00:00:00.000Z' }),
      enrollment({ userId: 'u2', courseTitle: 'IA Aplicada', progressPercentage: 40 }),
      enrollment({ userId: 'u3', courseTitle: 'Ética', progressPercentage: 20 }),
    ])

    expect(adoption[0].courseTitle).toBe('IA Aplicada')
    expect(adoption[0].enrolledUsers).toBe(2)
    expect(adoption[0].completedUsers).toBe(1)
    expect(adoption[0].averageProgressPercentage).toBe(70)
    expect(adoption[1].courseTitle).toBe('Ética')
  })

  it('no cuenta dos veces al mismo usuario en un curso', () => {
    const adoption = summarizeCourseAdoption([
      enrollment({ userId: 'u1', courseTitle: 'IA Aplicada' }),
      enrollment({ userId: 'u1', courseTitle: 'IA Aplicada' }),
    ])

    expect(adoption[0].enrolledUsers).toBe(1)
  })

  it('conserva la primera inscripción y el último acceso', () => {
    const adoption = summarizeCourseAdoption([
      enrollment({
        userId: 'u1',
        enrolledAt: '2026-05-01T00:00:00.000Z',
        lastAccessedAt: '2026-05-02T00:00:00.000Z',
      }),
      enrollment({
        userId: 'u2',
        enrolledAt: '2026-01-01T00:00:00.000Z',
        lastAccessedAt: '2026-07-30T00:00:00.000Z',
      }),
    ])

    expect(adoption[0].firstEnrollmentAt).toBe('2026-01-01T00:00:00.000Z')
    expect(adoption[0].lastAccessedAt).toBe('2026-07-30T00:00:00.000Z')
  })
})

describe('rankMemberPerformance', () => {
  it('ordena por progreso medio y resuelve el nombre desde la plantilla', () => {
    const { topPerformers } = rankMemberPerformance({
      members: [
        member({ userId: 'u1', name: 'Ana' }),
        member({ userId: 'u2', name: 'Beto' }),
      ],
      enrollments: [
        enrollment({ userId: 'u1', progressPercentage: 30 }),
        enrollment({ userId: 'u2', progressPercentage: 90 }),
      ],
      usersWithLessonActivity: new Set(['u1', 'u2']),
    })

    expect(topPerformers.map((person) => person.name)).toEqual(['Beto', 'Ana'])
    expect(topPerformers[0].averageProgressPercentage).toBe(90)
  })

  it('lista solo miembros ACTIVOS sin ninguna lección iniciada', () => {
    const { membersWithoutActivity } = rankMemberPerformance({
      members: [
        member({ userId: 'u1', name: 'Con actividad' }),
        member({ userId: 'u2', name: 'Sin actividad' }),
        member({ userId: 'u3', name: 'Retirado', status: 'removed' }),
      ],
      enrollments: [],
      usersWithLessonActivity: new Set(['u1']),
    })

    expect(membersWithoutActivity.map((person) => person.name)).toEqual([
      'Sin actividad',
    ])
  })
})
