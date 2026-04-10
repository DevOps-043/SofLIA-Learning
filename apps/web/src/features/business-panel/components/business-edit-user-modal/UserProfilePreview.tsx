'use client'

import { Edit3, Briefcase, Camera, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { UserFormData } from './useUserFormState'

const ROLE_LABELS_FALLBACK = {
  member: { label: 'Miembro', desc: '' },
  admin: { label: 'Admin', desc: '' },
  owner: { label: 'Propietario', desc: '' },
}

const STATUS_LABELS_FALLBACK = {
  active: 'Activo',
  invited: 'Invitado',
  suspended: 'Suspendido',
  removed: 'Eliminado',
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
}: UserProfilePreviewProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') },
  }

  const statusLabels = {
    active: { label: t('users.status.active'), color: theme.statusColors.active },
    invited: { label: t('users.status.invited'), color: theme.statusColors.invited },
    suspended: { label: t('users.status.suspended'), color: theme.statusColors.suspended },
    removed: { label: t('users.status.removed'), color: theme.statusColors.removed },
  }

  const currentRole = roleLabels[formData.org_role] ?? ROLE_LABELS_FALLBACK[formData.org_role]
  const currentStatus = statusLabels[formData.org_status] ?? {
    label: STATUS_LABELS_FALLBACK[formData.org_status] ?? STATUS_LABELS_FALLBACK.removed,
    color: theme.statusColors.removed,
  }

  return (
    <div
      className="lg:w-80 w-full shrink-0 items-center border-b p-6 text-center lg:border-b-0 lg:border-r lg:p-10"
      style={{
        borderColor: theme.borderColor,
        background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.accentColor}08)`,
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div
            className="h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 text-4xl font-black shadow-2xl flex items-center justify-center"
            style={{
              background: previewImage ? 'transparent' : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              color: theme.onPrimaryColor,
              borderColor: theme.dividerColor,
            }}
          >
            {previewImage ? (
              <Image src={previewImage} alt="Preview" fill className="object-cover" sizes="128px" />
            ) : (
              initials
            )}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl shadow-2xl transition-transform disabled:opacity-50"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.onPrimaryColor,
            }}
          >
            {isUploadingImage ? (
              <div
                className="h-5 w-5 animate-spin rounded-full border-2"
                style={{ borderColor: `${theme.onPrimaryColor}4D`, borderTopColor: theme.onPrimaryColor }}
              />
            ) : (
              <Camera className="h-6 w-6" style={{ color: theme.onPrimaryColor }} strokeWidth={2.5} />
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
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -left-3 -top-3 box-content flex h-10 w-10 items-center justify-center rounded-2xl border-4 shadow-xl"
            style={{
              backgroundColor: theme.accentColor,
              borderColor: theme.panelBg,
            }}
          >
            <Edit3 className="h-5 w-5" style={{ color: theme.onPrimaryColor }} strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <h2 className="mb-1 text-2xl font-black tracking-tight" style={{ color: theme.textColor }}>
          {displayName}
        </h2>
        <p className="mb-6 text-sm font-medium" style={{ color: theme.subtextColor }}>
          {email}
        </p>

        <div className="mb-8 w-full space-y-4">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.mutedTextColor }}>
              {t('users.modals.edit.currentRole', 'Rol Actual')}
            </div>
            <div
              className="inline-block rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                color: theme.onPrimaryColor,
                boxShadow: `0 10px 25px ${theme.primaryColor}30`,
              }}
            >
              {currentRole?.label}
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: `${currentStatus.color}15`,
              color: currentStatus.color,
              borderColor: `${currentStatus.color}30`,
            }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentStatus.color }} />
            {currentStatus.label}
          </div>
        </div>

        <div className="w-full space-y-3 border-t border-dashed py-6 text-left" style={{ borderColor: theme.borderColor }}>
          {formData.job_title ? (
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{ backgroundColor: theme.inputBg, color: theme.mutedTextColor }}>
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold" style={{ color: theme.subtextColor }}>
                {formData.job_title}
              </span>
            </div>
          ) : null}
          {formData.location ? (
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{ backgroundColor: theme.inputBg, color: theme.mutedTextColor }}>
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold" style={{ color: theme.subtextColor }}>
                {formData.location}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="w-full rounded-2xl border p-4 text-[11px] font-medium leading-relaxed"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.subtextColor }}
      >
        {t('users.modals.edit.infoNote', 'Los cambios realizados se guardarán y el usuario recibirá una notificación si es necesario.')}
      </div>
    </div>
  )
}
