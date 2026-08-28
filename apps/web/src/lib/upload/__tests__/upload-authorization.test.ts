import { describe, expect, it } from 'vitest'
import {
  authorizeGenericUpload,
  buildUserScopedUploadFolder,
} from '../upload-authorization'

describe('generic upload authorization', () => {
  it('allows authenticated users to upload only user-scoped assets', () => {
    expect(authorizeGenericUpload({ bucket: 'avatars', userRole: 'Usuario' })).toEqual({
      allowed: true,
    })
    expect(buildUserScopedUploadFolder('user-id', 'profile/pictures')).toBe(
      'users/user-id/profile/pictures',
    )
  })

  it('restricts course assets to instructors and administrators', () => {
    expect(authorizeGenericUpload({ bucket: 'courses', userRole: 'Usuario' })).toMatchObject({
      allowed: false,
    })
    expect(authorizeGenericUpload({ bucket: 'courses', userRole: 'Instructor' })).toEqual({
      allowed: true,
    })
  })

  it('restricts organization branding to business administrators', () => {
    expect(authorizeGenericUpload({ bucket: 'Panel-Business', userRole: 'Business User' })).toMatchObject({
      allowed: false,
    })
    expect(authorizeGenericUpload({ bucket: 'Panel-Business', userRole: 'Business' })).toEqual({
      allowed: true,
    })
  })

  it('routes large video uploads through dedicated protected endpoints', () => {
    expect(authorizeGenericUpload({ bucket: 'course-videos', userRole: 'Administrador' })).toEqual({
      allowed: false,
      code: 'DEDICATED_UPLOAD_REQUIRED',
    })
  })
})
