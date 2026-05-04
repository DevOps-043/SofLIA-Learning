'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { ProfileService } from '../services/profile.service'
import { createEmptyUserStats } from '../services/profile.shared'
import type { UpdateProfileRequest, UseProfileReturn, UserProfile, UserStats } from '../types/profile.types'

export type { UpdateProfileRequest, UserProfile, UserStats } from '../types/profile.types'

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

      const [profileData, userStats] = await Promise.all([
        ProfileService.getProfile(),
        ProfileService.getStats()
      ])

      setProfile(profileData)
      setStats(userStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStats(createEmptyUserStats())
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
      const updatedProfile = await ProfileService.updateProfile(updates)
      setProfile(updatedProfile)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-notifications'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
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
      const imageUrl = await ProfileService.uploadProfilePicture(file)
      setProfile(prev => (prev ? { ...prev, profile_picture_url: imageUrl } : null))
      return imageUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
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
      await ProfileService.changePassword(user.id, currentPassword, newPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    stats,
    loading,
    error,
    saving,
    updateProfile,
    uploadProfilePicture,
    changePassword,
    refetch: fetchProfile
  }
}
