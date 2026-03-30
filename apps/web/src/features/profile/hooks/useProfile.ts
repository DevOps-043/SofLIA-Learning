'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

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

interface UserSubscription {
  subscription_id: string
  subscription_type: string
  subscription_status: string
  price_cents: number
  start_date: string
  end_date: string | null
  next_billing_date: string | null
  course_id: string | null
  course_title?: string | null
}

interface UserStats {
  completedCourses: number
  completedLessons: number
  certificates: number
  coursesInProgress: number
  subscriptions?: UserSubscription[]
}

interface UseProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  loading: boolean
  error: string | null
  saving: boolean
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>
  uploadProfilePicture: (file: File) => Promise<string>
  uploadCurriculum: (file: File) => Promise<string>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Consultar directamente la base de datos
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Database['public']['Tables']['users']['Row'] | null, error: any }

      if (fetchError || !data) {
        throw new Error(`Error al obtener perfil: ${fetchError?.message || 'No data found'}`)
      }

      // Convertir los datos de la base de datos al formato esperado
      const profileData: UserProfile = {
        id: data.id,
        username: data.username || 'usuario',
        email: data.email || 'usuario@ejemplo.com',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || data.first_name || 'Usuario',
        phone: data.phone || data.phone_number || '',
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
        last_login_at: data.last_login_at || '',
        email_verified: data.email_verified || false
      }
      
      setProfile(profileData)

      // Obtener estadísticas del usuario desde la API
      try {
        const response = await fetch('/api/profile/stats', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const userStats = await response.json()
          setStats(userStats)
        } else {
          // Si falla, usar valores por defecto
          setStats({
            completedCourses: 0,
            averageProgress: 0,
            totalStudyTime: 0
          })
        }
      } catch (statsError) {
        // No lanzar error, solo usar valores por defecto
        setStats({
          completedCourses: 0,
          completedLessons: 0,
          certificates: 0,
          coursesInProgress: 0
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateProfile = useCallback(async (updates: UpdateProfileRequest) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // Usar el endpoint de la API para que se creen las notificaciones automáticamente
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Error al actualizar perfil')
      }

      const updatedProfileData: UserProfile = await response.json()
      
      setProfile(updatedProfileData)

      // Refrescar notificaciones inmediatamente para mostrar la nueva notificación
      // Disparamos un evento que el contexto de notificaciones escucha
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-notifications'))
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const uploadProfilePicture = useCallback(async (file: File) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // Usar el usuario del hook useAuth (ya verificado)
      const currentUser = user
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      
      // Validar archivo (coincide con configuración del bucket: image/png, image/jpeg, image/jpg, image/gif)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB (según configuración del bucket)
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB.')
      }
      
      
      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`


      // Subir archivo usando API REST (mejor manejo de autenticación y RLS)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Incluir cookies de sesión
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Error al subir imagen: ${response.statusText}`)
      }

      const { imageUrl } = await response.json()

      if (!imageUrl) {
        throw new Error('No se recibió la URL de la imagen')
      }

      // Actualizar perfil local con nueva URL
      setProfile(prev => prev ? { ...prev, profile_picture_url: imageUrl } : null)
      
      return imageUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const uploadCurriculum = useCallback(async (file: File) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // Usar el usuario del hook useAuth (ya verificado)
      const currentUser = user
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten PDF y documentos de Word.')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB.')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-cv-${Date.now()}.${fileExt}`
      const filePath = `curriculums/${fileName}`

      // Subir archivo a Supabase Storage
      // Usar createClient() que maneja la sesión del usuario correctamente
      const supabase = createClient()
      const { data, error: uploadError } = await supabase.storage
        .from('curriculums')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Error al subir curriculum: ${uploadError.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('curriculums')
        .getPublicUrl(filePath)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          curriculum_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (updateError) {
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }
      
      // Actualizar perfil local con nueva URL
      setProfile(prev => prev ? { ...prev, curriculum_url: publicUrl } : null)
      
      return publicUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // TODO: Implementar API para cambio de contraseña
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    stats,
    loading,
    error,
    saving,
    updateProfile,
    uploadProfilePicture,
    uploadCurriculum,
    changePassword,
    refetch
  }
}
