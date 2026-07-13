'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { saveAdminUser } from '../../admin-users-api'
import { createProfileFormData, updateProfileField } from '../profile-form.service'
import type { MasterPanelProfileFormData, ShowToast } from '../types'

interface UseProfileTabLogicParams {
  user: AdminUser
  showToast: ShowToast
  onUserSaved: () => Promise<void>
}

export function useProfileTabLogic({ user, showToast, onUserSaved }: UseProfileTabLogicParams) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<MasterPanelProfileFormData>(() =>
    createProfileFormData(user),
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFormData(createProfileFormData(user))
  }, [user])

  const setField = (name: keyof MasterPanelProfileFormData, value: string) =>
    setFormData((current) => updateProfileField(current, name, value))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // El selector de género usa '' como "sin especificar"; la API espera null.
      await saveAdminUser(user, { ...formData, gender: formData.gender || null }, t)
      showToast(t('users.masterPanel.profile.saved'))
      await onUserSaved()
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.page.errors.updateFailed'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return { formData, setField, handleSave, isSaving }
}
