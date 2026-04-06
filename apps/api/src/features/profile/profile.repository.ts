import { getServiceClient } from '@/core/supabase/service-client'
import type { UpdateProfileInput, UserProfile } from './profile.types'

export class ProfileRepository {
  private get supabase() {
    return getServiceClient()
  }

  async findById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, first_name, last_name, display_name, bio, location, phone, profile_picture_url, last_login_at, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data as UserProfile
  }

  async update(userId: string, input: UpdateProfileInput): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, username, email, first_name, last_name, display_name, bio, location, phone, profile_picture_url, last_login_at, created_at, updated_at')
      .single()

    if (error || !data) return null
    return data as UserProfile
  }

  async updateProfilePicture(userId: string, pictureUrl: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ profile_picture_url: pictureUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, username, email, first_name, last_name, display_name, bio, location, phone, profile_picture_url, last_login_at, created_at, updated_at')
      .single()

    if (error || !data) return null
    return data as UserProfile
  }
}
