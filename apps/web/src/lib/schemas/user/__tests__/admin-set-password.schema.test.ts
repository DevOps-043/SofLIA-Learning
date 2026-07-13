import { describe, expect, it } from 'vitest'
import { AdminSetPasswordSchema } from '../admin-set-password.schema'

const VALID_PASSWORD = 'SuperSegura2026x'

describe('AdminSetPasswordSchema', () => {
  it('acepta una contraseña válida con confirmación', () => {
    const result = AdminSetPasswordSchema.safeParse({
      new_password: VALID_PASSWORD,
      confirm_password: VALID_PASSWORD,
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ['corta', 'Abc1corta'],
    ['sin mayúscula', 'todominusculas26'],
    ['sin minúscula', 'TODOMAYUSCULAS26'],
    ['sin número', 'SinNumerosAquiXx'],
  ])('rechaza contraseña %s', (_label, password) => {
    const result = AdminSetPasswordSchema.safeParse({
      new_password: password,
      confirm_password: password,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza cuando la confirmación no coincide', () => {
    const result = AdminSetPasswordSchema.safeParse({
      new_password: VALID_PASSWORD,
      confirm_password: `${VALID_PASSWORD}!`,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirm_password')
    }
  })

  it('rechaza confirmación vacía', () => {
    const result = AdminSetPasswordSchema.safeParse({
      new_password: VALID_PASSWORD,
      confirm_password: '',
    })
    expect(result.success).toBe(false)
  })
})
