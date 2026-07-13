'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminSetPasswordSchema } from '../../../../../../lib/schemas/user/admin-set-password.schema'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { saveAdminUser } from '../../admin-users-api'
import { revokeUserSessions, setUserPassword } from '../master-panel-api'
import { createAccountFormData } from '../profile-form.service'
import type { MasterPanelAccountFormData, ShowToast } from '../types'

interface UseAccountTabLogicParams {
  user: AdminUser
  showToast: ShowToast
  onUserSaved: () => Promise<void>
}

export function useAccountTabLogic({ user, showToast, onUserSaved }: UseAccountTabLogicParams) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<MasterPanelAccountFormData>(() =>
    createAccountFormData(user),
  )
  const [isSaving, setIsSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSettingPassword, setIsSettingPassword] = useState(false)

  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const [banReason, setBanReason] = useState('')
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false)
  const [isTogglingBan, setIsTogglingBan] = useState(false)

  useEffect(() => {
    setFormData(createAccountFormData(user))
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setIsRevokeConfirmOpen(false)
    setBanReason('')
    setIsBanConfirmOpen(false)
  }, [user])

  const setField = <K extends keyof MasterPanelAccountFormData>(
    name: K,
    value: MasterPanelAccountFormData[K],
  ) => setFormData((current) => ({ ...current, [name]: value }))

  const handleSaveAccount = async () => {
    setIsSaving(true)
    try {
      await saveAdminUser(user, formData, t)
      showToast(t('users.masterPanel.account.saved'))
      await onUserSaved()
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.page.errors.updateFailed'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetPassword = async () => {
    const parsed = AdminSetPasswordSchema.safeParse({
      new_password: newPassword,
      confirm_password: confirmPassword,
    })
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? t('users.masterPanel.account.password.mismatch'))
      return
    }
    setPasswordError(null)
    setIsSettingPassword(true)
    try {
      await setUserPassword(user.id, parsed.data)
      setNewPassword('')
      setConfirmPassword('')
      showToast(t('users.masterPanel.account.password.success'))
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.account.password.error'),
        'error',
      )
    } finally {
      setIsSettingPassword(false)
    }
  }

  const handleToggleBan = async () => {
    const willBan = !user.is_banned
    setIsTogglingBan(true)
    try {
      await saveAdminUser(
        user,
        { is_banned: willBan, ban_reason: willBan ? banReason.trim() || null : null },
        t,
      )
      if (willBan) {
        // La suspensión debe tener efecto inmediato: se expulsa al usuario
        // de todas sus sesiones (best-effort; la cuenta ya quedó suspendida).
        try {
          await revokeUserSessions(user.id)
        } catch {
          showToast(t('users.masterPanel.account.sessions.error'), 'error')
        }
      }
      showToast(
        willBan
          ? t('users.masterPanel.account.ban.banned')
          : t('users.masterPanel.account.ban.unbanned'),
      )
      setBanReason('')
      setIsBanConfirmOpen(false)
      await onUserSaved()
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.page.errors.updateFailed'), 'error')
    } finally {
      setIsTogglingBan(false)
    }
  }

  const handleRevokeSessions = async () => {
    setIsRevoking(true)
    try {
      await revokeUserSessions(user.id)
      showToast(t('users.masterPanel.account.sessions.revoked'))
      setIsRevokeConfirmOpen(false)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.account.sessions.error'),
        'error',
      )
    } finally {
      setIsRevoking(false)
    }
  }

  return {
    user,
    formData,
    setField,
    handleSaveAccount,
    isSaving,
    banReason,
    setBanReason,
    isBanConfirmOpen,
    setIsBanConfirmOpen,
    isTogglingBan,
    handleToggleBan,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    isSettingPassword,
    handleSetPassword,
    isRevokeConfirmOpen,
    setIsRevokeConfirmOpen,
    isRevoking,
    handleRevokeSessions,
  }
}
