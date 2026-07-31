'use client'

import { useCallback, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessUser, UpdateBusinessUserRequest } from '../../services/businessUsers.service'
import { UserFormFields } from './UserFormFields'
import { UserProfilePreview } from './UserProfilePreview'
import { useUserFormState, type UserFormData } from './useUserFormState'
import styles from './BusinessEditUserModal.module.css'

interface BusinessEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: BusinessUser | null
  onSave: (id: string, data: UpdateBusinessUserRequest) => Promise<void>
  orgSlug?: string
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

export function BusinessEditUserModal({ isOpen, onClose, user, onSave, orgSlug }: BusinessEditUserModalProps) {
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
  const form = useUserFormState(user, handleSave, onClose, orgSlug)

  if (!isOpen || !user) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center overflow-hidden p-0 sm:p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{
            backgroundColor: theme.overlayBg,
            backdropFilter: 'blur(20px) saturate(105%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={styles.modal}
          style={{
            '--edit-action': theme.actionColor,
            '--edit-on-action': theme.onActionColor,
            '--edit-accent': theme.accentColor,
            '--edit-text': theme.textColor,
            '--edit-subtext': theme.subtextColor,
            '--edit-muted': theme.mutedTextColor,
            '--edit-surface': theme.cardBg,
            '--edit-panel': theme.panelBg,
            '--edit-input': theme.inputBg,
            '--edit-hover': theme.hoverBg,
            '--edit-border': theme.borderColor,
            '--edit-divider': theme.dividerColor,
            '--edit-success': theme.successColor,
            '--edit-danger': theme.dangerColor,
            '--edit-warning': theme.warningColor,
          } as CSSProperties}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="business-edit-user-title"
        >
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
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
