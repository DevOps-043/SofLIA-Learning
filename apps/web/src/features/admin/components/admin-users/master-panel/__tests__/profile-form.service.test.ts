import { describe, expect, it } from 'vitest'
import {
  createAccountFormData,
  createProfileFormData,
  getMasterPanelDisplayName,
  updateProfileField,
} from '../profile-form.service'

describe('master-panel/profile-form.service', () => {
  it('normaliza el formulario de perfil desde el usuario', () => {
    const result = createProfileFormData({
      id: '1',
      username: 'demo',
      email: 'demo@test.com',
      first_name: 'Demo',
      last_name: 'User',
      display_name: null,
      cargo_rol: 'Administrador',
      email_verified: true,
      phone: null,
      bio: null,
      location: null,
      profile_picture_url: null,
      country_code: null,
      created_at: null,
      updated_at: null,
      last_login_at: null,
    } as never)

    expect(result.username).toBe('demo')
    expect(result.email).toBe('demo@test.com')
    expect(result.display_name).toBe('')
    expect(result.phone).toBe('')
  })

  it('normaliza el formulario de cuenta con defaults seguros', () => {
    expect(createAccountFormData(null)).toEqual({
      cargo_rol: 'Usuario',
      email_verified: false,
    })

    expect(
      createAccountFormData({
        cargo_rol: 'Business',
        
        email_verified: true,
      } as never),
    ).toEqual({ cargo_rol: 'Business',  email_verified: true })
  })

  it('actualiza campos del perfil sin romper el shape', () => {
    const base = createProfileFormData()
    const updated = updateProfileField(base, 'first_name', 'Ada')

    expect(updated.first_name).toBe('Ada')
    expect(updated).toMatchObject({ ...base, first_name: 'Ada' })
  })

  it('resuelve el display name con fallbacks', () => {
    expect(
      getMasterPanelDisplayName({
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

    expect(
      getMasterPanelDisplayName({
        id: '1',
        username: 'user-name',
        email: null,
        first_name: null,
        last_name: null,
        display_name: null,
        cargo_rol: null,
        email_verified: false,
        profile_picture_url: null,
        created_at: null,
        updated_at: null,
        last_login_at: null,
      } as never),
    ).toBe('user-name')
  })
})
