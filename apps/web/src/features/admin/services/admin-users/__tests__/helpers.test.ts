import { describe, expect, it } from 'vitest'
import {
  ADMIN_USERS_DEFAULT_PAGE_SIZE,
  ADMIN_USERS_MAX_PAGE_SIZE,
  buildAdminUserUpdatePayload,
  buildPostgrestIlikePattern,
  normalizeUsersPagination,
} from '../helpers'

describe('buildAdminUserUpdatePayload — suspensión de cuenta', () => {
  it('no toca banned_at/ban_reason cuando la petición no trae is_banned', () => {
    const payload = buildAdminUserUpdatePayload({ first_name: 'Ada' })

    expect(payload.is_banned).toBeUndefined()
    expect(payload.banned_at).toBeUndefined()
    expect(payload.ban_reason).toBeUndefined()
  })

  it('al suspender estampa banned_at server-side y conserva el motivo', () => {
    const payload = buildAdminUserUpdatePayload({
      is_banned: true,
      ban_reason: 'incumplimiento de políticas',
    })

    expect(payload.is_banned).toBe(true)
    expect(typeof payload.banned_at).toBe('string')
    expect(payload.ban_reason).toBe('incumplimiento de políticas')
  })

  it('al suspender sin motivo guarda ban_reason null (no cadena vacía)', () => {
    const payload = buildAdminUserUpdatePayload({ is_banned: true, ban_reason: '' })

    expect(payload.ban_reason).toBeNull()
  })

  it('al reactivar limpia banned_at y ban_reason', () => {
    const payload = buildAdminUserUpdatePayload({
      is_banned: false,
      ban_reason: 'esto debe ignorarse',
    })

    expect(payload.is_banned).toBe(false)
    expect(payload.banned_at).toBeNull()
    expect(payload.ban_reason).toBeNull()
  })
})

describe('buildPostgrestIlikePattern', () => {
  it('envuelve el termino en comodines y comillas', () => {
    expect(buildPostgrestIlikePattern('fernando')).toBe('"%fernando%"')
  })

  it('mantiene intactos los correos con punto y arroba', () => {
    expect(buildPostgrestIlikePattern('fernando.suarez@soflia.ai')).toBe(
      '"%fernando.suarez@soflia.ai%"',
    )
  })

  it('neutraliza la coma, que separaria condiciones dentro de or()', () => {
    // Sin comillas esto anadiria un filtro OR ajeno a la consulta.
    expect(buildPostgrestIlikePattern('a,platform_role.eq.Administrador')).toBe(
      '"%a,platform_role.eq.Administrador%"',
    )
  })

  it('escapa comillas y barras invertidas', () => {
    expect(buildPostgrestIlikePattern('di"jo')).toBe('"%di\\"jo%"')
    expect(buildPostgrestIlikePattern('c:\\ruta')).toBe('"%c:\\\\ruta%"')
  })
})

describe('normalizeUsersPagination', () => {
  it('usa el tamano de pagina por defecto y la primera pagina', () => {
    expect(normalizeUsersPagination()).toMatchObject({
      page: 1,
      limit: ADMIN_USERS_DEFAULT_PAGE_SIZE,
      from: 0,
      to: ADMIN_USERS_DEFAULT_PAGE_SIZE - 1,
    })
  })

  it('calcula el rango de la pagina solicitada', () => {
    expect(normalizeUsersPagination({ page: 3, limit: 20 })).toMatchObject({
      from: 40,
      to: 59,
    })
  })

  it('topa el limite pedido al maximo del servidor', () => {
    expect(normalizeUsersPagination({ limit: 500 }).limit).toBe(
      ADMIN_USERS_MAX_PAGE_SIZE,
    )
  })

  it('descarta paginas y limites no positivos', () => {
    expect(normalizeUsersPagination({ page: 0, limit: -5 })).toMatchObject({
      page: 1,
      limit: ADMIN_USERS_DEFAULT_PAGE_SIZE,
    })
  })

  it('recorta el termino de busqueda y trata el vacio como ausente', () => {
    expect(normalizeUsersPagination({ search: '  fer  ' }).search).toBe('fer')
    expect(normalizeUsersPagination({ search: '   ' }).search).toBeUndefined()
  })
})
