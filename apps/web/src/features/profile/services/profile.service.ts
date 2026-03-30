import { createClient } from '../../../lib/supabase/client'

export interface UserProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  bio: string
  location: string
  cargo_rol: string
  type_rol: string
  profile_picture_url: string
  curriculum_url: string
  linkedin_url: string
  github_url: string
  website_url: string
  country_code: string
  points: number
  created_at: string
  last_login_at: string
  email_verified: boolean
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  bio?: string
  location?: string
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
  curriculum_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  country_code?: string
}

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw new Error(`Error al obtener perfil: ${error.message}`)
      }

      if (!data) {
        throw new Error('Perfil no encontrado')
      }

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: data.curriculum_url || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        website_url: data.website_url || '',
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      throw error
    }
  }

  static async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Error al actualizar perfil: ${error.message}`)
      }

      if (!data) {
        throw new Error('Error al actualizar perfil')
      }

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: data.curriculum_url || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        website_url: data.website_url || '',
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      throw error
    }
  }

  static async uploadProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const supabase = createClient()
      
      // Validar tipo de archivo (coincide con configuración del bucket: image/png, image/jpeg, image/jpg, image/gif)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      }

      // Validar tamaño (máximo 10MB según configuración del bucket)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB.')
      }
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      // Subir archivo a Supabase Storage (bucket: avatars)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Error al subir imagen: ${error.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Actualizar perfil con nueva URL
      await this.updateProfile(userId, { profile_picture_url: publicUrl })

      return publicUrl
    } catch (error) {
      throw error
    }
  }

  static async uploadCurriculum(userId: string, file: File): Promise<string> {
    try {
      const supabase = createClient()
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-cv-${Date.now()}.${fileExt}`
      const filePath = `curriculums/${fileName}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('curriculums')
        .upload(filePath, file)

      if (error) {
        throw new Error(`Error al subir curriculum: ${error.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('curriculums')
        .getPublicUrl(filePath)

      // Actualizar perfil con nueva URL
      await this.updateProfile(userId, { curriculum_url: publicUrl })

      return publicUrl
    } catch (error) {
      throw error
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      throw error
    }
  }

}
