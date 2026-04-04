'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import type { BusinessUser } from '../../services/businessUsers.service'
import { useUserFormState, type UserFormData } from './useUserFormState'
import { UserProfilePreview } from './UserProfilePreview'
import { UserFormFields } from './UserFormFields'

interface BusinessEditUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
    cargo_rol?: string
    job_title?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
    profile_picture_url?: string
    bio?: string
    location?: string
    phone?: string
  }) => Promise<void>
}

export function BusinessEditUserModal({ user, isOpen, onClose, onSave }: BusinessEditUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = styles?.panel?.primary_button_color || '#0EA5E9'
  const accentColor = styles?.panel?.accent_color || '#10B981'

  const {
    fileInputRef, formData, setFormData,
    isLoading, isUploadingImage, error,
    previewImage, handleChange, handleImageChange, handleSubmit,
  } = useUserFormState(user, onSave as (id: string, data: UserFormData) => Promise<void>, onClose)

  if (!isOpen || !user) return null

  const displayName = formData.display_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || user.username
  const initials = (formData.first_name?.[0] || user.username[0] || 'U').toUpperCase() + (formData.last_name?.[0] || '').toUpperCase()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">
              <UserProfilePreview
                previewImage={previewImage}
                initials={initials}
                displayName={displayName}
                email={formData.email || user.email}
                formData={formData}
                isUploadingImage={isUploadingImage}
                fileInputRef={fileInputRef}
                onFileChange={handleImageChange}
                primaryColor={primaryColor}
                accentColor={accentColor}
                isDark={isDark}
              />

              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t('users.modals.edit.title')}</h3>
                    <p className="text-sm text-white/40 mt-0.5">{t('users.modals.edit.subtitle')}</p>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <UserFormFields
                  formData={formData}
                  error={error}
                  isLoading={isLoading}
                  isUploadingImage={isUploadingImage}
                  isDark={isDark}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                  onChange={handleChange}
                  onRoleChange={role => setFormData(prev => ({ ...prev, org_role: role }))}
                  onStatusChange={status => setFormData(prev => ({ ...prev, org_status: status }))}
                  onClose={onClose}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
