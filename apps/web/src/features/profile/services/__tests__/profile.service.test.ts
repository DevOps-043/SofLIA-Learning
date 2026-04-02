import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileService } from '../profile.service'

describe('ProfileService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads the profile from the secured API endpoint', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'user-1', first_name: 'Ada' }), { status: 200 })
    )

    const profile = await ProfileService.getProfile()

    expect(fetchMock).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ credentials: 'include', method: 'GET' }))
    expect(profile).toMatchObject({ id: 'user-1', first_name: 'Ada' })
  })

  it('returns default stats when stats endpoint fails', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))

    await expect(ProfileService.getStats()).resolves.toMatchObject({
      completedCourses: 0,
      completedLessons: 0,
      certificates: 0,
      coursesInProgress: 0
    })
  })

  it('validates image uploads before performing the request', async () => {
    await expect(
      ProfileService.uploadProfilePicture(new File(['x'], 'avatar.txt', { type: 'text/plain' }))
    ).rejects.toThrow('Tipo de archivo no válido')
  })

  it('propagates API errors when the password change fails', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Contraseña actual incorrecta' }), { status: 400 })
    )

    await expect(ProfileService.changePassword('user-1', 'wrong', 'new')).rejects.toThrow('Contraseña actual incorrecta')
  })
})
