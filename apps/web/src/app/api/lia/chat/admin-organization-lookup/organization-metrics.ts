import type {
  OrganizationCourseAdoption,
  OrganizationFirstLessonStarts,
  OrganizationMember,
  OrganizationMemberPerformance,
  OrganizationMemberSummary,
} from './types'
import {
  MAX_COURSES_IN_DOSSIER,
  MAX_MEMBERS_WITHOUT_ACTIVITY,
  MAX_RECENT_JOINS,
  MAX_TOP_PERFORMERS,
} from './types'

/**
 * Agregaciones del dossier de organización. Funciones PURAS: reciben filas ya
 * leídas y devuelven las métricas listas para el prompt.
 *
 * Viven separadas del servicio de datos porque son la parte con reglas de
 * negocio reales (qué cuenta como "activo", cómo se calcula la mediana de
 * arranque, qué curso encabeza la adopción) y son las que conviene cubrir con
 * tests sin tocar la base de datos.
 */

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

function daysSince(value: string | null | undefined, now: number): number | null {
  const timestamp = toTimestamp(value)
  if (timestamp === null) return null
  return (now - timestamp) / MILLISECONDS_PER_DAY
}

function latestIso(a: string | null, b: string | null): string | null {
  const timestampA = toTimestamp(a)
  const timestampB = toTimestamp(b)
  if (timestampA === null) return b
  if (timestampB === null) return a
  return timestampA >= timestampB ? a : b
}

function earliestIso(a: string | null, b: string | null): string | null {
  const timestampA = toTimestamp(a)
  const timestampB = toTimestamp(b)
  if (timestampA === null) return b
  if (timestampB === null) return a
  return timestampA <= timestampB ? a : b
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Composición de la plantilla y consumo de licencias.
 *
 * "Activo" en licencias = membresía con estado `active`. Es el mismo criterio
 * que usa el panel de organizaciones, para que SofLIA no dé una cifra distinta
 * a la que el administrador está viendo en pantalla.
 */
export function summarizeMembers(params: {
  members: OrganizationMember[]
  licenseLimit: number | null
  truncated: boolean
  now: number
}): OrganizationMemberSummary {
  const { members, licenseLimit, truncated, now } = params

  const byStatus = (status: string) =>
    members.filter((member) => (member.status ?? '').toLowerCase() === status).length
  const byRole = (role: string) =>
    members.filter((member) => (member.role ?? '').toLowerCase() === role).length

  const activeMembers = byStatus('active')

  const activityDays = members
    .filter((member) => (member.status ?? '').toLowerCase() === 'active')
    .map((member) => daysSince(member.lastActivityAt ?? member.lastLoginAt, now))

  const recentJoins = [...members]
    .filter((member) => Boolean(member.joinedAt))
    .sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || ''))
    .slice(0, MAX_RECENT_JOINS)
    .map((member) => ({
      name: member.name,
      role: member.role,
      jobTitle: member.jobTitle,
      joinedAt: member.joinedAt,
    }))

  return {
    totalMembers: members.length,
    activeMembers,
    invitedMembers: byStatus('invited'),
    suspendedMembers: byStatus('suspended'),
    removedMembers: byStatus('removed'),
    owners: byRole('owner'),
    admins: byRole('admin'),
    regularMembers: byRole('member'),
    licenseLimit,
    licenseUsagePercentage:
      licenseLimit && licenseLimit > 0
        ? roundToOneDecimal((activeMembers / licenseLimit) * 100)
        : null,
    activeLast7Days: activityDays.filter((days) => days !== null && days <= 7).length,
    activeLast30Days: activityDays.filter((days) => days !== null && days <= 30).length,
    neverActive: activityDays.filter((days) => days === null).length,
    recentJoins,
    truncated,
  }
}

export interface LessonStartRow {
  userId: string
  startedAt: string | null
}

/**
 * Cuándo empezó a estudiar realmente la plantilla.
 *
 * Se calcula el PRIMER inicio de lección de cada persona y sobre esa serie se
 * devuelven extremos, mediana y reparto por mes. La mediana y el reparto son lo
 * que permite responder "¿cuándo empezaron la mayoría?" sin que un rezagado
 * distorsione la respuesta.
 */
export function summarizeFirstLessonStarts(params: {
  rows: LessonStartRow[]
  truncated: boolean
}): OrganizationFirstLessonStarts {
  const { rows, truncated } = params

  const firstStartByUser = new Map<string, string>()
  for (const row of rows) {
    if (!row.startedAt || toTimestamp(row.startedAt) === null) continue
    const current = firstStartByUser.get(row.userId)
    if (!current || row.startedAt < current) {
      firstStartByUser.set(row.userId, row.startedAt)
    }
  }

  const starts = Array.from(firstStartByUser.values()).sort((a, b) => a.localeCompare(b))

  if (starts.length === 0) {
    return {
      usersWithStart: 0,
      earliestAt: null,
      latestAt: null,
      medianAt: null,
      monthlyDistribution: [],
      truncated,
    }
  }

  const monthly = new Map<string, number>()
  for (const start of starts) {
    const month = start.slice(0, 7)
    monthly.set(month, (monthly.get(month) ?? 0) + 1)
  }

  return {
    usersWithStart: starts.length,
    earliestAt: starts[0],
    latestAt: starts[starts.length - 1],
    medianAt: starts[Math.floor((starts.length - 1) / 2)],
    monthlyDistribution: Array.from(monthly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, users]) => ({ month, users })),
    truncated,
  }
}

export interface EnrollmentRow {
  userId: string
  courseTitle: string | null
  status: string | null
  progressPercentage: number
  enrolledAt: string | null
  completedAt: string | null
  lastAccessedAt: string | null
}

/**
 * Adopción por curso, ordenada por número de inscritos: es el orden en que un
 * administrador lee la tabla ("¿qué curso está usando la empresa?").
 */
export function summarizeCourseAdoption(
  enrollments: EnrollmentRow[],
): OrganizationCourseAdoption[] {
  const byCourse = new Map<
    string,
    {
      enrolledUsers: Set<string>
      completedUsers: Set<string>
      progressSum: number
      progressCount: number
      firstEnrollmentAt: string | null
      lastAccessedAt: string | null
    }
  >()

  for (const enrollment of enrollments) {
    const title = enrollment.courseTitle?.trim() || 'Curso sin título'
    const current = byCourse.get(title) ?? {
      enrolledUsers: new Set<string>(),
      completedUsers: new Set<string>(),
      progressSum: 0,
      progressCount: 0,
      firstEnrollmentAt: null,
      lastAccessedAt: null,
    }

    current.enrolledUsers.add(enrollment.userId)
    if (enrollment.completedAt || (enrollment.status ?? '').toLowerCase() === 'completed') {
      current.completedUsers.add(enrollment.userId)
    }
    current.progressSum += enrollment.progressPercentage
    current.progressCount += 1
    current.firstEnrollmentAt = earliestIso(current.firstEnrollmentAt, enrollment.enrolledAt)
    current.lastAccessedAt = latestIso(current.lastAccessedAt, enrollment.lastAccessedAt)

    byCourse.set(title, current)
  }

  return Array.from(byCourse.entries())
    .map(([courseTitle, aggregate]) => ({
      courseTitle,
      enrolledUsers: aggregate.enrolledUsers.size,
      completedUsers: aggregate.completedUsers.size,
      averageProgressPercentage:
        aggregate.progressCount > 0
          ? roundToOneDecimal(aggregate.progressSum / aggregate.progressCount)
          : 0,
      firstEnrollmentAt: aggregate.firstEnrollmentAt,
      lastAccessedAt: aggregate.lastAccessedAt,
    }))
    .sort((a, b) => b.enrolledUsers - a.enrolledUsers)
    .slice(0, MAX_COURSES_IN_DOSSIER)
}

/**
 * Ranking de personas por progreso medio y, en el otro extremo, miembros
 * activos que no han iniciado ninguna lección (el dato accionable para el
 * administrador que quiere empujar la adopción).
 */
export function rankMemberPerformance(params: {
  members: OrganizationMember[]
  enrollments: EnrollmentRow[]
  usersWithLessonActivity: Set<string>
}): {
  topPerformers: OrganizationMemberPerformance[]
  membersWithoutActivity: Array<{
    name: string
    jobTitle: string | null
    joinedAt: string | null
  }>
} {
  const memberById = new Map(
    params.members.map((member) => [member.userId, member] as const),
  )

  const byUser = new Map<
    string,
    {
      coursesEnrolled: number
      coursesCompleted: number
      progressSum: number
      lastAccessedAt: string | null
    }
  >()

  for (const enrollment of params.enrollments) {
    const current = byUser.get(enrollment.userId) ?? {
      coursesEnrolled: 0,
      coursesCompleted: 0,
      progressSum: 0,
      lastAccessedAt: null,
    }
    current.coursesEnrolled += 1
    if (enrollment.completedAt || (enrollment.status ?? '').toLowerCase() === 'completed') {
      current.coursesCompleted += 1
    }
    current.progressSum += enrollment.progressPercentage
    current.lastAccessedAt = latestIso(current.lastAccessedAt, enrollment.lastAccessedAt)
    byUser.set(enrollment.userId, current)
  }

  const topPerformers = Array.from(byUser.entries())
    .map(([userId, aggregate]) => {
      const member = memberById.get(userId)
      return {
        name: member?.name ?? 'Usuario sin nombre',
        jobTitle: member?.jobTitle ?? null,
        coursesEnrolled: aggregate.coursesEnrolled,
        coursesCompleted: aggregate.coursesCompleted,
        averageProgressPercentage: roundToOneDecimal(
          aggregate.progressSum / aggregate.coursesEnrolled,
        ),
        lastAccessedAt: aggregate.lastAccessedAt,
      }
    })
    .sort(
      (a, b) =>
        b.averageProgressPercentage - a.averageProgressPercentage ||
        b.coursesCompleted - a.coursesCompleted,
    )
    .slice(0, MAX_TOP_PERFORMERS)

  const membersWithoutActivity = params.members
    .filter(
      (member) =>
        (member.status ?? '').toLowerCase() === 'active' &&
        !params.usersWithLessonActivity.has(member.userId),
    )
    .sort((a, b) => (a.joinedAt || '').localeCompare(b.joinedAt || ''))
    .slice(0, MAX_MEMBERS_WITHOUT_ACTIVITY)
    .map((member) => ({
      name: member.name,
      jobTitle: member.jobTitle,
      joinedAt: member.joinedAt,
    }))

  return { topPerformers, membersWithoutActivity }
}
