import {
  PROFILE_CURRICULUM_ALLOWED_TYPES,
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_UPLOAD_MAX_SIZE_BYTES,
  normalizeUserStats,
  resolveProfileApiError
} from './profile.shared'
import type { UpdateProfileRequest, UserProfile, UserStats } from '../types/profile.types'

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

export class ProfileService {
  static async getProfile(): Promise<UserProfile> {
    const response = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include'
    })

    await ensureOk(response, 'Error al obtener el perfil')
    return await response.json()
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

  static async updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    const response = await fetch('/api/profile', {
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

  static async uploadCurriculum(file: File): Promise<string> {
    validateUpload(file, PROFILE_CURRICULUM_ALLOWED_TYPES, 'Tipo de archivo no válido. Solo se permiten PDF y documentos Word.')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/profile/upload-curriculum', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    await ensureOk(response, 'Error al subir curriculum')
    const payload = await response.json()
    return payload.cvUrl
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
