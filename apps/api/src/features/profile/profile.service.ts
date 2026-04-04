import { NotFoundError } from '@/core/errors/app-error'
import { ProfileRepository } from './profile.repository'
import type { UpdateProfileInput, UserProfile } from './profile.types'

export class ProfileService {
  constructor(private readonly repo: ProfileRepository = new ProfileRepository()) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.repo.findById(userId)
    if (!profile) throw new NotFoundError('Perfil de usuario no encontrado')
    return profile
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const profile = await this.repo.update(userId, input)
    if (!profile) throw new NotFoundError('No se pudo actualizar el perfil')
    return profile
  }

  async updateProfilePicture(userId: string, pictureUrl: string): Promise<UserProfile> {
    const profile = await this.repo.updateProfilePicture(userId, pictureUrl)
    if (!profile) throw new NotFoundError('No se pudo actualizar la imagen de perfil')
    return profile
  }
}
