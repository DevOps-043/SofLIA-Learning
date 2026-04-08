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
      className={`lg:w-80 w-full p-6 lg:p-10 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0 items-center text-center ${isDark ? 'border-white/5' : 'border-black/5 bg-slate-50/50'}`}
      style={{ 
        background: isDark 
          ? `linear-gradient(135deg, ${primaryColor}10, ${accentColor}05)` 
          : `linear-gradient(135deg, ${primaryColor}08, ${accentColor}03)` 
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Avatar with upload button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div
            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-4xl font-black overflow-hidden shadow-2xl border-4 ${isDark ? 'border-white/5' : 'border-white'}`}
            style={{
              background: previewImage ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#FFFFFF',
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
            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl disabled:opacity-50 transition-transform"
            style={{
              backgroundColor: primaryColor,
              color: isDark ? '#000000' : '#FFFFFF',
            }}
          >
            {isUploadingImage ? (
              <div className={`w-5 h-5 border-2 ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} />
            ) : (
              <Camera className="w-6 h-6" strokeWidth={2.5} />
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
            className="absolute -top-3 -left-3 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl box-content border-4"
            style={{ 
              backgroundColor: accentColor,
              borderColor: isDark ? '#0f1218' : '#FFFFFF'
            }}
          >
            <Edit3 className="w-5 h-5" style={{ color: isDark ? '#000000' : '#FFFFFF' }} strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <h2 className={`text-2xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>{displayName}</h2>
        <p className={`text-sm font-medium mb-6 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{email}</p>

        <div className="w-full space-y-4 mb-8">
          <div>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              {t('users.modals.edit.currentRole', 'Rol Actual')}
            </div>
            <div
              className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg inline-block"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                color: isDark ? '#000000' : '#FFFFFF',
                boxShadow: `0 10px 25px ${primaryColor}30`,
              }}
            >
              {currentRole?.label}
            </div>
          </div>

          <div
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 border"
            style={{
              backgroundColor: `${currentStatus?.color ?? '#6B7280'}15`,
              color: currentStatus?.color ?? '#6B7280',
              borderColor: `${currentStatus?.color ?? '#6B7280'}30`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStatus?.color }} />
            {currentStatus?.label}
          </div>
        </div>

        <div className="w-full space-y-3 py-6 border-t border-dashed border-slate-200 dark:border-white/10 text-left">
          {formData.job_title && (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{formData.job_title}</span>
            </div>
          )}
          {formData.location && (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{formData.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`w-full p-4 rounded-2xl border text-[11px] font-medium leading-relaxed ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-blue-50/50 border-blue-100/50 text-slate-500'}`}>
        {t('users.modals.edit.infoNote', 'Los cambios realizados se guardarán y el usuario recibirá una notificación si es necesario.')}
      </div>
    </div>
  )
}
