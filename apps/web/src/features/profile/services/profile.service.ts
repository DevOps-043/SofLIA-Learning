import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_UPLOAD_MAX_SIZE_BYTES,
  normalizeUserStats,
  resolveProfileApiError
} from './profile.shared'
import type { UpdateProfileRequest, UserProfile, UserStats } from '../types/profile.types'

interface ProfileBundleResponse {
  profile?: UserProfile
  stats?: Partial<UserStats> | null
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return
  }

  const payload = await parseJsonResponse(response)
  throw new Error(resolveProfileApiError(payload, fallbackMessage))
}

function validateUpload(file: File, allowedTypes: readonly string[], invalidTypeMessage: string) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(invalidTypeMessage)
  }

  if (file.size > PROFILE_UPLOAD_MAX_SIZE_BYTES) {
    throw new Error('El archivo es demasiado grande. Máximo 10MB.')
  }
}

function buildProfileUrl(
  organizationId?: string | null,
  params?: Record<string, string>,
) {
  const searchParams = new URLSearchParams(params)
  if (organizationId) {
    searchParams.set('org', organizationId)
  }

  const query = searchParams.toString()
  return query ? `/api/profile?${query}` : '/api/profile'
}

export class ProfileService {
  static async getProfile(organizationId?: string | null): Promise<UserProfile> {
    const url = buildProfileUrl(organizationId)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    await ensureOk(response, 'Error al obtener el perfil')
    return await response.json()
  }

  static async getProfileBundle(
    organizationId?: string | null,
  ): Promise<{ profile: UserProfile; stats: UserStats }> {
    const response = await fetch(
      buildProfileUrl(organizationId, { includeStats: '1' }),
      {
        method: 'GET',
        credentials: 'include'
      },
    )

    await ensureOk(response, 'Error al obtener el perfil')

    const payload = (await response.json()) as ProfileBundleResponse
    if (!payload.profile) {
      throw new Error('Error al obtener el perfil')
    }

    return {
      profile: payload.profile,
      stats: normalizeUserStats(payload.stats),
    }
  }

  static async getStats(): Promise<UserStats> {
    const response = await fetch('/api/profile/stats', {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      return normalizeUserStats(null)
    }

    return normalizeUserStats(await response.json())
  }

  static async updateProfile(updates: UpdateProfileRequest, organizationId?: string | null): Promise<UserProfile> {
    const url = buildProfileUrl(organizationId)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    })

    await ensureOk(response, 'Error al actualizar perfil')
    return await response.json()
  }

  static async uploadProfilePicture(file: File): Promise<string> {
    validateUpload(file, PROFILE_IMAGE_ALLOWED_TYPES, 'Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/profile/upload-picture', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    await ensureOk(response, 'Error al subir imagen')
    const payload = await response.json()
    return payload.imageUrl
  }

  static async changePassword(_userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch('/api/profile/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    })

    await ensureOk(response, 'Error al cambiar la contraseña')
  }
}
