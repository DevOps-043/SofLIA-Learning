'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { useAuth } from '../../auth/hooks/useAuth'
import { useOrganizationStyles } from '../../business-panel/hooks/useOrganizationStyles'
import { ChangePasswordSchema, type ChangePasswordInput } from '../../../lib/schemas/user.schema'
import { buildAuthLoginPath } from '@/lib/auth/auth-routes'
import { useProfile } from './useProfile'
import { createProfileUpdateRequest, formatProfileDate, resolveProfileColors } from '../services/profile.shared'
import type { ProfileTabId, UpdateProfileRequest } from '../types/profile.types'

export function useProfilePageLogic() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const { effectiveStyles } = useOrganizationStyles()
  const colors = useMemo(() => resolveProfileColors(effectiveStyles?.userDashboard), [effectiveStyles])

  const {
    profile,
    stats,
    loading,
    saving,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    changePassword,
  } = useProfile()

  const [formData, setFormData] = useState<UpdateProfileRequest>({})
  const [activeTab, setActiveTab] = useState<ProfileTabId>('personal')
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>(
    { isOpen: false, message: '', type: 'success' }
  )
  const showToast = useCallback((message: string, type: ToastType = 'success') =>
    setToast({ isOpen: true, message, type }), [])
  const hideToast = useCallback(() =>
    setToast(prev => ({ ...prev, isOpen: false })), [])
  const [imageError, setImageError] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isRemovingProfilePicture, setIsRemovingProfilePicture] = useState(false)

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
    showToast(t('profile.header.saved'), 'success')
  }

  const handleProfilePictureUpload = async (file: File) => {
    setImageError(false)
    await uploadProfilePicture(file)
  }

  const handleProfilePictureRemove = async () => {
    setImageError(false)
    setIsRemovingProfilePicture(true)

    try {
      await removeProfilePicture()
    } finally {
      setIsRemovingProfilePicture(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.id || !currentPassword || !newPassword) {
      showToast(t('profile.security.completePasswordFields'), 'error')
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword(currentPassword, newPassword)
      showToast(t('profile.security.passwordUpdated'), 'success')
      resetPasswordForm()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('profile.security.passwordChangeError'),
        'error',
      )
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
    toast,
    hideToast,
    imageError,
    setImageError,
    isRemovingProfilePicture,
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
    isChangingPassword,
    setPasswordValue,
    handleInputChange,
    handleSave,
    handleProfilePictureUpload,
    handleProfilePictureRemove,
    handleChangePassword,
    goBack: () => router.back(),
    goToLogin: () => router.push(buildAuthLoginPath('session_expired')),
    retryLoad: () => window.location.reload(),
    formatDate: formatProfileDate
  }
}
