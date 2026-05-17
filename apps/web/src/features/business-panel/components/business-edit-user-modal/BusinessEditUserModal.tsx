'use client'

import { useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessUser, UpdateBusinessUserRequest } from '../../services/businessUsers.service'
import { UserFormFields } from './UserFormFields'
import { UserProfilePreview } from './UserProfilePreview'
import { useUserFormState, type UserFormData } from './useUserFormState'

interface BusinessEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: BusinessUser | null
  onSave: (id: string, data: UpdateBusinessUserRequest) => Promise<void>
}

function getUserInitials(formData: UserFormData): string {
  const first = formData.first_name?.[0] || formData.display_name?.[0] || ''
  const last = formData.last_name?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'U'
}

function getDisplayName(formData: UserFormData, user: BusinessUser): string {
  return (
    formData.display_name ||
    `${formData.first_name} ${formData.last_name}`.trim() ||
    user.display_name ||
    user.username ||
    user.email
  )
}

export function BusinessEditUserModal({ isOpen, onClose, user, onSave }: BusinessEditUserModalProps) {
  const theme = useBusinessPanelTheme()
  const handleSave = useCallback(
    async (userId: string, formData: UserFormData) => {
      await onSave(userId, {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
      })
    },
    [onSave]
  )
  const form = useUserFormState(user, handleSave, onClose)

  if (!isOpen || !user) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 isolate flex items-center justify-center p-0 sm:p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: theme.overlayBg }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden shadow-2xl sm:h-[86vh] sm:max-h-[780px] sm:rounded-[2rem] lg:flex-row"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
          onClick={(event) => event.stopPropagation()}
        >
          <UserProfilePreview
            previewImage={form.previewImage}
            initials={getUserInitials(form.formData)}
            displayName={getDisplayName(form.formData, user)}
            email={form.formData.email || user.email}
            formData={form.formData}
            isUploadingImage={form.isUploadingImage}
            fileInputRef={form.fileInputRef}
            onFileChange={form.handleImageChange}
          />
          <UserFormFields
            formData={form.formData}
            error={form.error}
            isLoading={form.isLoading}
            isUploadingImage={form.isUploadingImage}
            isDark={theme.isDark}
            primaryColor={theme.primaryColor}
            accentColor={theme.accentColor}
            onChange={form.handleChange}
            onRoleChange={(role) => form.setFormData((prev) => ({ ...prev, org_role: role }))}
            onStatusChange={(status) => form.setFormData((prev) => ({ ...prev, org_status: status }))}
            onClose={onClose}
            onSubmit={form.handleSubmit}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
