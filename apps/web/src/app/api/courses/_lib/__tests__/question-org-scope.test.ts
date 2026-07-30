import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  applyQuestionsOrgScope,
  isQuestionInOrgScope,
  resolveQuestionsOrgScope,
} from '../question-org-scope'

const resolveUserPrimaryMembership = vi.hoisted(() => vi.fn())
const resolveCourseOrganizationScope = vi.hoisted(() => vi.fn())

vi.mock('@/lib/services/user-org-context.service', () => ({
  resolveUserPrimaryMembership,
}))

vi.mock('@/features/courses/services/course-enrollment.server.service', () => ({
  resolveCourseOrganizationScope,
}))

const ORG_A = '11111111-1111-1111-1111-111111111111'
const ORG_B = '22222222-2222-2222-2222-222222222222'
const EMPTY_SCOPE_SENTINEL = '00000000-0000-0000-0000-000000000000'
const COURSE_ID = '33333333-3333-3333-3333-333333333333'

/** Doble mínimo del query builder: sólo registra las llamadas a `.eq()`. */
function createQueryStub() {
  const calls: Array<[string, string]> = []
  const query = {
    calls,
    eq(column: string, value: string) {
      calls.push([column, value])
      return query
    },
  }
  return query
}

describe('resolveQuestionsOrgScope', () => {
  beforeEach(() => {
    resolveUserPrimaryMembership.mockReset()
    resolveCourseOrganizationScope.mockReset()
    resolveCourseOrganizationScope.mockResolvedValue(null)
  })

  it('devuelve alcance vacío para usuarios sin sesión', async () => {
    const scope = await resolveQuestionsOrgScope({} as never, null)

    expect(scope).toEqual({ isPlatformAdmin: false, organizationId: null })
    expect(resolveUserPrimaryMembership).not.toHaveBeenCalled()
  })

  it('usa la organización activa del empleado', async () => {
    resolveUserPrimaryMembership.mockResolvedValue({ organization_id: ORG_A })

    const scope = await resolveQuestionsOrgScope({} as never, {
      id: 'user-1',
      platform_role: 'usuario',
    })

    expect(scope).toEqual({ isPlatformAdmin: false, organizationId: ORG_A })
  })

  it('marca al superadmin y conserva su organización si tiene una', async () => {
    resolveUserPrimaryMembership.mockResolvedValue({ organization_id: ORG_A })

    const scope = await resolveQuestionsOrgScope({} as never, {
      id: 'admin-1',
      platform_role: 'Administrador',
    })

    expect(scope).toEqual({ isPlatformAdmin: true, organizationId: ORG_A })
  })

  it('deja la organización en null cuando no hay membresía activa', async () => {
    resolveUserPrimaryMembership.mockResolvedValue(null)

    const scope = await resolveQuestionsOrgScope({} as never, {
      id: 'user-2',
      platform_role: null,
    })

    expect(scope).toEqual({ isPlatformAdmin: false, organizationId: null })
  })

  // Regresión: un usuario en dos empresas publicaba y leía en su organización
  // "principal" aunque estuviera cursando por la otra. Sus preguntas quedaban
  // visibles para quien no comparte el curso e invisibles para quien sí.
  it('usa la organización de la inscripción al curso, no la membresía principal', async () => {
    resolveUserPrimaryMembership.mockResolvedValue({ organization_id: ORG_A })
    resolveCourseOrganizationScope.mockResolvedValue(ORG_B)

    const scope = await resolveQuestionsOrgScope(
      {} as never,
      { id: 'user-multi', platform_role: 'usuario' },
      COURSE_ID,
    )

    expect(scope).toEqual({ isPlatformAdmin: false, organizationId: ORG_B })
    expect(resolveUserPrimaryMembership).not.toHaveBeenCalled()
  })

  it('traslada la organización pedida a la resolución de la inscripción', async () => {
    resolveCourseOrganizationScope.mockResolvedValue(ORG_A)

    const scope = await resolveQuestionsOrgScope(
      {} as never,
      { id: 'user-multi', platform_role: 'usuario' },
      COURSE_ID,
      ORG_A,
    )

    expect(scope.organizationId).toBe(ORG_A)
    expect(resolveCourseOrganizationScope).toHaveBeenCalledWith(
      expect.anything(),
      'user-multi',
      COURSE_ID,
      ORG_A,
    )
  })

  it('cae a la membresía principal cuando no hay inscripción en el curso', async () => {
    resolveUserPrimaryMembership.mockResolvedValue({ organization_id: ORG_A })
    resolveCourseOrganizationScope.mockResolvedValue(null)

    const scope = await resolveQuestionsOrgScope(
      {} as never,
      { id: 'instructor-1', platform_role: 'instructor' },
      COURSE_ID,
    )

    expect(scope).toEqual({ isPlatformAdmin: false, organizationId: ORG_A })
  })

  it('sella al superadmin con la organización del curso que está cursando', async () => {
    resolveUserPrimaryMembership.mockResolvedValue({ organization_id: ORG_A })
    resolveCourseOrganizationScope.mockResolvedValue(ORG_B)

    const scope = await resolveQuestionsOrgScope(
      {} as never,
      { id: 'admin-1', platform_role: 'Administrador' },
      COURSE_ID,
    )

    expect(scope).toEqual({ isPlatformAdmin: true, organizationId: ORG_B })
  })
})

describe('applyQuestionsOrgScope', () => {
  it('no filtra para el superadmin de plataforma', () => {
    const query = createQueryStub()

    applyQuestionsOrgScope(query, { isPlatformAdmin: true, organizationId: null })

    expect(query.calls).toHaveLength(0)
  })

  it('filtra por la organización del usuario', () => {
    const query = createQueryStub()

    applyQuestionsOrgScope(query, { isPlatformAdmin: false, organizationId: ORG_A })

    expect(query.calls).toEqual([['organization_id', ORG_A]])
  })

  it('fuerza un conjunto vacío cuando el usuario no tiene organización', () => {
    const query = createQueryStub()

    applyQuestionsOrgScope(query, { isPlatformAdmin: false, organizationId: null })

    expect(query.calls).toEqual([['organization_id', EMPTY_SCOPE_SENTINEL]])
  })
})

describe('isQuestionInOrgScope', () => {
  it('permite las preguntas de la propia organización', () => {
    expect(
      isQuestionInOrgScope({ organization_id: ORG_A }, { isPlatformAdmin: false, organizationId: ORG_A }),
    ).toBe(true)
  })

  it('bloquea las preguntas de otra organización', () => {
    expect(
      isQuestionInOrgScope({ organization_id: ORG_B }, { isPlatformAdmin: false, organizationId: ORG_A }),
    ).toBe(false)
  })

  it('bloquea las preguntas huérfanas (sin organización) para empleados', () => {
    expect(
      isQuestionInOrgScope({ organization_id: null }, { isPlatformAdmin: false, organizationId: ORG_A }),
    ).toBe(false)
  })

  it('bloquea todo cuando el usuario no tiene organización', () => {
    expect(
      isQuestionInOrgScope({ organization_id: null }, { isPlatformAdmin: false, organizationId: null }),
    ).toBe(false)
  })

  it('permite todo al superadmin de plataforma', () => {
    expect(
      isQuestionInOrgScope({ organization_id: ORG_B }, { isPlatformAdmin: true, organizationId: null }),
    ).toBe(true)
  })
})
