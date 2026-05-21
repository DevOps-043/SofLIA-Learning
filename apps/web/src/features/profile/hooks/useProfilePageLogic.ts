'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { useOrganizationStyles } from '../../business-panel/hooks/useOrganizationStyles'
import { ChangePasswordSchema, type ChangePasswordInput } from '../../../lib/schemas/user.schema'
import { buildAuthLoginPath } from '@/lib/auth/auth-routes'
import { useProfile } from './useProfile'
import { ProfileService } from '../services/profile.service'
import { createProfileUpdateRequest, formatProfileDate, resolveProfileColors } from '../services/profile.shared'
import type { ProfileTabId, UpdateProfileRequest } from '../types/profile.types'

export function useProfilePageLogic() {
  const router = useRouter()
  const { user } = useAuth()
  const { effectiveStyles } = useOrganizationStyles()
  const colors = useMemo(() => resolveProfileColors(effectiveStyles?.userDashboard), [effectiveStyles])

  const { profile, stats, loading, saving, updateProfile, uploadProfilePicture } = useProfile()

  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  const [activeTab, setActiveTab] = useState<ProfileTabId>('personal')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch: watchPassword,
    trigger: triggerPassword,
    setValue: setPasswordValue
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onChange',
    defaultValues: { current_password: '', new_password: '', confirm_password: '' }
  })

  const currentPassword = watchPassword('current_password')
  const newPassword = watchPassword('new_password')
  const confirmPassword = watchPassword('confirm_password')

  useEffect(() => {
    if (newPassword && currentPassword && newPassword.length > 0 && currentPassword.length > 0) {
      const timeoutId = setTimeout(() => {
        void triggerPassword('new_password')
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [currentPassword, newPassword, triggerPassword])

  useEffect(() => {
    if (profile) {
      setFormData(createProfileUpdateRequest(profile))
    }
  }, [profile])

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    await updateProfile(formData)
    setShowSaveSuccess(true)
    window.setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleProfilePictureUpload = async (file: File) => {
    setImageError(false)
    await uploadProfilePicture(file)
  }

  const handleChangePassword = async () => {
    if (!user?.id || !currentPassword || !newPassword) {
      setPasswordChangeError('Completa todos los campos')
      return
    }

    setIsChangingPassword(true)
    setPasswordChangeError(null)
    setPasswordChangeSuccess(null)

    try {
      await ProfileService.changePassword(user.id, currentPassword, newPassword)
      setPasswordChangeSuccess('¡Contraseña actualizada!')
      resetPasswordForm()
      window.setTimeout(() => setPasswordChangeSuccess(null), 5000)
    } catch (error) {
      setPasswordChangeError(error instanceof Error ? error.message : 'Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return {
    colors,
    profile,
    stats,
    loading,
    saving,
    activeTab,
    setActiveTab,
    formData,
    showSaveSuccess,
    imageError,
    setImageError,
    passwordErrors,
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    passwordChangeError,
    passwordChangeSuccess,
    isChangingPassword,
    setPasswordValue,
    handleInputChange,
    handleSave,
    handleProfilePictureUpload,
    handleChangePassword,
    goBack: () => router.back(),
    goToLogin: () => router.push(buildAuthLoginPath('session_expired')),
    retryLoad: () => window.location.reload(),
    formatDate: formatProfileDate
  }
}
