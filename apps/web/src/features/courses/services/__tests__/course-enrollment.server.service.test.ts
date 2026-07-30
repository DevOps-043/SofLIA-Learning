import { describe, expect, it } from 'vitest'
import {
  mapPreferredCourseEnrollments,
  resolveAnyScopeCourseEnrollment,
  resolveCourseOrganizationScope,
  selectPreferredCourseEnrollment,
  type CourseEnrollmentRecord,
} from '../course-enrollment.server.service'

function buildEnrollment(
  overrides: Partial<CourseEnrollmentRecord>,
): CourseEnrollmentRecord {
  return {
    enrollment_id: 'enrollment-1',
    organization_id: null,
    overall_progress_percentage: 0,
    enrollment_status: 'active',
    last_accessed_at: '2026-04-10T10:00:00.000Z',
    enrolled_at: '2026-04-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('course-enrollment.server.service', () => {
  it('prefers the active organization enrollment when it already has progress', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'legacy',
          overall_progress_percentage: 40,
        }),
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('keeps the exact organization enrollment even when legacy progress is higher', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 0,
        }),
        buildEnrollment({
          enrollment_id: 'legacy',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('returns null when the requested organization has no exact enrollment', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'legacy',
          overall_progress_percentage: 96.88,
        }),
        buildEnrollment({
          enrollment_id: 'pulse-hub',
          organization_id: 'pulse-hub-org',
          overall_progress_percentage: 80,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment).toBeNull()
  })

  it('keeps the exact organization enrollment when there is no legacy fallback', () => {
    const enrollment = selectPreferredCourseEnrollment(
      [
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 0,
        }),
        buildEnrollment({
          enrollment_id: 'pulse-hub',
          organization_id: 'pulse-hub-org',
          overall_progress_percentage: 96.88,
        }),
      ],
      'board-ready-org',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('uses the legacy enrollment first when there is no active organization context', () => {
    const enrollment = selectPreferredCourseEnrollment([
      buildEnrollment({
        enrollment_id: 'legacy',
        overall_progress_percentage: 24,
      }),
      buildEnrollment({
        enrollment_id: 'other-org',
        organization_id: 'org-2',
        overall_progress_percentage: 50,
      }),
    ])

    expect(enrollment?.enrollment_id).toBe('legacy')
  })

  it('maps each course to the preferred enrollment for the active organization', () => {
    const enrollmentMap = mapPreferredCourseEnrollments(
      [
        {
          ...buildEnrollment({
            enrollment_id: 'course-a-legacy',
            overall_progress_percentage: 20,
          }),
          course_id: 'course-a',
        },
        {
          ...buildEnrollment({
            enrollment_id: 'course-a-org',
            organization_id: 'org-1',
            overall_progress_percentage: 60,
          }),
          course_id: 'course-a',
        },
        {
          ...buildEnrollment({
            enrollment_id: 'course-b-legacy',
            overall_progress_percentage: 35,
          }),
          course_id: 'course-b',
        },
      ],
      'org-1',
    )

    expect(enrollmentMap.get('course-a')?.enrollment_id).toBe('course-a-org')
    expect(enrollmentMap.has('course-b')).toBe(false)
  })
})

/**
 * Stub mínimo del builder de PostgREST: solo la cadena que usa
 * loadCourseEnrollments (select -> eq -> eq -> order -> order).
 */
function buildSupabaseStub(rows: CourseEnrollmentRecord[]) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    then: (resolve: (value: { data: CourseEnrollmentRecord[] }) => unknown) =>
      resolve({ data: rows }),
  }
  return { from: () => builder } as never
}

describe('resolveAnyScopeCourseEnrollment', () => {
  it('encuentra la inscripción aunque pertenezca a una organización', async () => {
    // Regresión: los endpoints sin ámbito de organización buscaban
    // `organization_id IS NULL` y dejaban fuera a todo usuario de empresa,
    // que es el caso del 98% de las inscripciones reales.
    const enrollment = await resolveAnyScopeCourseEnrollment(
      buildSupabaseStub([
        buildEnrollment({
          enrollment_id: 'board-ready',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 65.71,
        }),
      ]),
      'user-1',
      'course-1',
    )

    expect(enrollment?.enrollment_id).toBe('board-ready')
  })

  it('elige la inscripción con más progreso cuando hay varias organizaciones', async () => {
    const enrollment = await resolveAnyScopeCourseEnrollment(
      buildSupabaseStub([
        buildEnrollment({
          enrollment_id: 'sin-empezar',
          organization_id: 'otra-org',
          overall_progress_percentage: 0,
        }),
        buildEnrollment({
          enrollment_id: 'en-curso',
          organization_id: 'board-ready-org',
          overall_progress_percentage: 65.71,
        }),
      ]),
      'user-1',
      'course-1',
    )

    expect(enrollment?.enrollment_id).toBe('en-curso')
    expect(enrollment?.organization_id).toBe('board-ready-org')
  })

  it('devuelve null cuando el usuario no tiene ninguna inscripción', async () => {
    const enrollment = await resolveAnyScopeCourseEnrollment(
      buildSupabaseStub([]),
      'user-1',
      'course-1',
    )

    expect(enrollment).toBeNull()
  })
})

describe('resolveCourseOrganizationScope', () => {
  it('respeta la organización pedida cuando el usuario está inscrito en ella', async () => {
    // Usuario en dos empresas navegando desde la de menor progreso: la
    // comunidad debe coincidir con la empresa desde la que entra.
    const organizationId = await resolveCourseOrganizationScope(
      buildSupabaseStub([
        buildEnrollment({
          enrollment_id: 'la-mas-avanzada',
          organization_id: 'org-a',
          overall_progress_percentage: 90,
        }),
        buildEnrollment({
          enrollment_id: 'desde-la-que-navega',
          organization_id: 'org-b',
          overall_progress_percentage: 5,
        }),
      ]),
      'user-1',
      'course-1',
      'org-b',
    )

    expect(organizationId).toBe('org-b')
  })

  it('ignora una organización pedida en la que el usuario no está inscrito', async () => {
    // El `orgId` viene del cliente: nunca puede abrir la comunidad de otra
    // empresa, así que se descarta y se elige entre las inscripciones reales.
    const organizationId = await resolveCourseOrganizationScope(
      buildSupabaseStub([
        buildEnrollment({
          enrollment_id: 'la-suya',
          organization_id: 'org-a',
          overall_progress_percentage: 90,
        }),
      ]),
      'user-1',
      'course-1',
      'org-ajena',
    )

    expect(organizationId).toBe('org-a')
  })

  it('descarta las inscripciones heredadas sin organización', async () => {
    // Regresión: una inscripción personal (organization_id NULL) con más
    // progreso ganaba el desempate y dejaba el ámbito sin empresa.
    const organizationId = await resolveCourseOrganizationScope(
      buildSupabaseStub([
        buildEnrollment({
          enrollment_id: 'heredada-sin-empresa',
          organization_id: null,
          overall_progress_percentage: 90,
        }),
        buildEnrollment({
          enrollment_id: 'la-de-la-empresa',
          organization_id: 'org-a',
          overall_progress_percentage: 5,
        }),
      ]),
      'user-1',
      'course-1',
    )

    expect(organizationId).toBe('org-a')
  })

  it('devuelve null cuando ninguna inscripción tiene organización', async () => {
    const organizationId = await resolveCourseOrganizationScope(
      buildSupabaseStub([
        buildEnrollment({ enrollment_id: 'heredada', organization_id: null }),
      ]),
      'user-1',
      'course-1',
    )

    expect(organizationId).toBeNull()
  })
})
