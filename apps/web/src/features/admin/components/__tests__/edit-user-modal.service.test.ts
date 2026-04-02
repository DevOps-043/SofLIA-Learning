import { describe, expect, it } from 'vitest'
import {
  createEditUserFormData,
  getEditUserDisplayName,
  updateEditUserField,
} from '../edit-user-modal/service'

describe('edit-user-modal.service', () => {
  it('normaliza el formulario inicial desde el usuario', () => {
    const result = createEditUserFormData({
      id: '1',
      username: 'demo',
      email: 'demo@test.com',
      first_name: 'Demo',
      last_name: 'User',
      display_name: null,
      cargo_rol: 'Administrador',
      type_rol: 'admin',
      email_verified: true,
      phone: null,
      bio: null,
      location: null,
      profile_picture_url: null,
      country_code: null,
      created_at: null,
      updated_at: null,
      last_login_at: null,
      points: 15,
    } as never)

    expect(result.points).toBe(15)
    expect(result.username).toBe('demo')
    expect(result.cargo_rol).toBe('Administrador')
  })

  it('actualiza checkboxes y numeros sin romper el shape', () => {
    const base = createEditUserFormData()

    expect(updateEditUserField(base, 'email_verified', true, 'checkbox')).toMatchObject({
      email_verified: true,
    })
    expect(updateEditUserField(base, 'points', '24', 'number')).toMatchObject({
      points: 24,
    })
  })

  it('resuelve el display name con fallbacks', () => {
    expect(
      getEditUserDisplayName({
        id: '1',
        username: 'user-name',
        email: null,
        first_name: 'Ada',
        last_name: 'Lovelace',
        display_name: null,
        cargo_rol: null,
        email_verified: false,
        profile_picture_url: null,
        created_at: null,
        updated_at: null,
        last_login_at: null,
      } as never),
    ).toBe('Ada Lovelace')
  })
})
