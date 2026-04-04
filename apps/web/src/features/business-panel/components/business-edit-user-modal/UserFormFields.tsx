'use client'

import { X, Mail, Shield, Briefcase, MapPin, Phone, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { UserFormData } from './useUserFormState'

interface UserFormFieldsProps {
  formData: UserFormData
  error: string | null
  isLoading: boolean
  isUploadingImage: boolean
  isDark: boolean
  primaryColor: string
  accentColor: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onRoleChange: (role: UserFormData['org_role']) => void
  onStatusChange: (status: UserFormData['org_status']) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function UserFormFields({
  formData,
  error,
  isLoading,
  isUploadingImage,
  isDark,
  primaryColor,
  accentColor,
  onChange,
  onRoleChange,
  onStatusChange,
  onClose,
  onSubmit,
}: UserFormFieldsProps) {
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

  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors'
  const iconColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
      <div
        className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400 flex-1">{error}</span>
          </motion.div>
        )}

        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.firstName')}</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={onChange}
              className={inputClass} placeholder={t('users.modals.add.placeholders.firstName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.lastName')}</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={onChange}
              className={inputClass} placeholder={t('users.modals.add.placeholders.lastName')} />
          </div>
        </div>

        {/* Display Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.fullName')}</label>
            <input type="text" name="display_name" value={formData.display_name} onChange={onChange}
              className={inputClass} placeholder={t('users.modals.edit.placeholders.fullName')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
              <input type="email" name="email" value={formData.email} onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                placeholder={t('users.modals.add.placeholders.email')} />
            </div>
          </div>
        </div>

        {/* Cargo & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.position')}</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
              <input type="text" name="cargo_rol" value={formData.cargo_rol} onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                placeholder={t('users.modals.add.placeholders.position')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.typeRole')}</label>
            <input type="text" name="job_title" value={formData.job_title} onChange={onChange}
              className={inputClass} placeholder={t('users.modals.edit.placeholders.typeRole')} />
          </div>
        </div>

        {/* Phone & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.phone')}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
              <input type="tel" name="phone" value={formData.phone} onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                placeholder={t('users.modals.edit.placeholders.phone')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.location')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
              <input type="text" name="location" value={formData.location} onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                placeholder={t('users.modals.edit.placeholders.location')} />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.bio')}</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4" style={{ color: iconColor }} />
            <textarea name="bio" value={formData.bio} onChange={onChange} rows={3}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
              placeholder={t('users.modals.edit.placeholders.bio')} />
          </div>
        </div>

        {/* Org Role */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
              {t('users.modals.add.fields.orgRole')}
            </label>
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}40, ${accentColor}30)`,
                color: isDark ? '#FFFFFF' : primaryColor,
                border: `1px solid ${primaryColor}60`,
              }}
            >
              {t('users.modals.edit.currentRole')}: <span className="font-bold">{roleLabels[formData.org_role].label}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
            {(['member', 'admin', 'owner'] as const).map(role => (
              <button key={role} type="button" onClick={() => onRoleChange(role)}
                className={`p-2 lg:p-3 rounded-xl border text-left transition-all ${formData.org_role === role ? 'border-transparent' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                style={formData.org_role === role ? { background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`, borderColor: primaryColor } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4" style={{ color: formData.org_role === role ? '#FFFFFF' : 'rgba(255,255,255,0.8)' }} />
                  <span className="text-xs lg:text-sm font-medium"
                    style={{ color: formData.org_role === role ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') }}>
                    {roleLabels[role].label}
                  </span>
                </div>
                <p className="text-xs hidden sm:block" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
                  {roleLabels[role].desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Org Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
            {t('users.modals.edit.fields.status')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
            {(['active', 'invited', 'suspended', 'removed'] as const).map(status => (
              <button key={status} type="button" onClick={() => onStatusChange(status)}
                className={`p-2 lg:p-3 rounded-xl border text-center transition-all ${formData.org_status === status ? 'border-transparent' : isDark ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-black/10 hover:border-black/20 bg-black/5'}`}
                style={formData.org_status === status ? { background: `${statusLabels[status].color}20`, borderColor: statusLabels[status].color } : {}}
              >
                <span className="text-xs lg:text-sm font-medium"
                  style={{ color: formData.org_status === status ? statusLabels[status].color : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') }}>
                  {statusLabels[status].label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} disabled={isLoading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          {t('users.buttons.cancel')}
        </button>
        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          disabled={isLoading || isUploadingImage}
          className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            color: '#FFFFFF',
            boxShadow: `0 4px 15px ${primaryColor}40`,
          }}
        >
          {isLoading || isUploadingImage ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isUploadingImage ? t('users.buttons.uploading') : t('users.buttons.saving')}
            </>
          ) : (
            t('users.buttons.save')
          )}
        </motion.button>
      </div>
    </form>
  )
}
