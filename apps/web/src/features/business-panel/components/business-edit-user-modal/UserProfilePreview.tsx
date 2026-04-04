'use client'

import { Camera, Briefcase, MapPin, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import type { UserFormData } from './useUserFormState'

const ROLE_LABELS_FALLBACK = {
  member: { label: 'Miembro', desc: '' },
  admin: { label: 'Admin', desc: '' },
  owner: { label: 'Propietario', desc: '' },
}

const STATUS_LABELS_FALLBACK: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: '#10B981' },
  invited: { label: 'Invitado', color: '#F59E0B' },
  suspended: { label: 'Suspendido', color: '#EF4444' },
  removed: { label: 'Eliminado', color: '#6B7280' },
}

interface UserProfilePreviewProps {
  previewImage: string | null
  initials: string
  displayName: string
  email: string
  formData: Pick<UserFormData, 'org_role' | 'org_status' | 'job_title' | 'location'>
  isUploadingImage: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  primaryColor: string
  accentColor: string
  isDark: boolean
}

export function UserProfilePreview({
  previewImage,
  initials,
  displayName,
  email,
  formData,
  isUploadingImage,
  fileInputRef,
  onFileChange,
  primaryColor,
  accentColor,
  isDark,
}: UserProfilePreviewProps) {
  const { t } = useTranslation('business')

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') },
  }
  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: t('users.status.active'), color: '#10B981' },
    invited: { label: t('users.status.invited'), color: '#F59E0B' },
    suspended: { label: t('users.status.suspended'), color: '#EF4444' },
    removed: { label: t('users.status.removed'), color: '#6B7280' },
  }

  const currentRole = roleLabels[formData.org_role] ?? ROLE_LABELS_FALLBACK[formData.org_role]
  const currentStatus = statusLabels[formData.org_status] ?? STATUS_LABELS_FALLBACK[formData.org_status]

  return (
    <div
      className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 shrink-0"
      style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
    >
      <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
        {/* Avatar with upload button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
            style={{
              background: previewImage ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              boxShadow: previewImage ? 'none' : `0 8px 30px ${primaryColor}40`,
              color: previewImage ? 'transparent' : '#FFFFFF',
            }}
          >
            {previewImage ? (
              <Image src={previewImage} alt="Preview" fill className="object-cover" sizes="112px" />
            ) : (
              initials
            )}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg disabled:opacity-50"
            style={{
              backgroundColor: primaryColor,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            {isUploadingImage ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={onFileChange}
            className="hidden"
          />

          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Edit3 className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>

        <h2 className="text-xl font-bold text-white mb-1 text-center">{displayName}</h2>
        <p className="text-sm text-white/50 text-center mb-3">{email}</p>

        <div className="mb-2">
          <div className="text-xs text-white/50 mb-1 text-center">{t('users.modals.edit.currentRole')}</div>
          <div
            className="px-4 py-2 rounded-full text-sm font-semibold text-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#FFFFFF',
              border: `1px solid ${primaryColor}80`,
              boxShadow: isDark ? `0 4px 15px ${primaryColor}40` : `0 4px 15px ${primaryColor}30`,
            }}
          >
            {currentRole?.label}
          </div>
        </div>

        <div
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${currentStatus?.color ?? '#6B7280'}20`,
            color: currentStatus?.color ?? '#6B7280',
          }}
        >
          {currentStatus?.label}
        </div>

        {formData.job_title && (
          <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
            <Briefcase className="w-4 h-4" />
            <span>{formData.job_title}</span>
          </div>
        )}
        {formData.location && (
          <div className="mt-2 flex items-center gap-2 text-white/40 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{formData.location}</span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50">
        <p>{t('users.modals.edit.infoNote')}</p>
      </div>
    </div>
  )
}
