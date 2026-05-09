'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  Info,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type {
  BusinessUser,
  UpdateBusinessUserRequest,
} from '../../services/businessUsers.service'
import {
  USER_GENDER_VALUES,
  type UserGender,
} from '../../../../lib/schemas/user-demographics.schema'

interface UserFormData {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  location: string
  bio: string
  date_of_birth: string
  gender: UserGender | ''
  job_title: string
  org_role: 'owner' | 'admin' | 'member'
  org_status: 'active' | 'invited' | 'suspended' | 'removed'
  profile_picture_url: string
}

interface BusinessEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: BusinessUser | null
  onSave: (id: string, data: UpdateBusinessUserRequest) => Promise<void>
}

export function BusinessEditUserModal({
  isOpen,
  onClose,
  user,
  onSave,
}: BusinessEditUserModalProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const theme = useBusinessPanelTheme()

  const [formData, setFormData] = useState<Partial<UserFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      display_name: user.display_name || '',
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      date_of_birth: user.date_of_birth || '',
      gender: user.gender || '',
      job_title: user.job_title || '',
      org_role: user.org_role || 'member',
      org_status: user.org_status || 'active',
      profile_picture_url: user.profile_picture_url || '',
    })
    setError(null)
  }, [user])

  const primaryColor = theme.primaryColor
  const accentColor = theme.accentColor
  const textColor = theme.textColor
  const mutedText = theme.mutedTextColor
  const borderColor = theme.borderColor
  const inputBg = theme.inputBg
  const surfaceColor = theme.panelBg
  const onPrimaryColor = theme.onPrimaryColor
  const maxDateOfBirth = new Date().toISOString().slice(0, 10)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSaving(true)
    setError(null)

    try {
      await onSave(user.id, {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.edit.errors.save'))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-transparent"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[750px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex flex-col h-full overflow-hidden border"
            style={{ backgroundColor: surfaceColor, borderColor }}
          >
            <div
              className="relative shrink-0 pt-6 pb-4 px-6 lg:px-12 border-b"
              style={{ borderColor }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative shrink-0">
                  <div
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4 overflow-hidden relative"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      borderColor,
                    }}
                  >
                    {user.profile_picture_url ? (
                      <Image
                        src={user.profile_picture_url}
                        alt={user.display_name || user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User
                        className="w-8 h-8"
                        style={{ color: onPrimaryColor }}
                        strokeWidth={2.5}
                      />
                    )}
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2"
                    style={{ backgroundColor: primaryColor, borderColor }}
                  >
                    <Info className="w-4 h-4" style={{ color: onPrimaryColor }} />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2
                    className="text-2xl font-black tracking-tight mb-1"
                    style={{ color: textColor }}
                  >
                    {formData.display_name || t('users.modals.edit.title')}
                  </h2>
                  <div
                    className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                    style={{
                      backgroundColor: inputBg,
                      borderColor,
                      color: mutedText,
                    }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{formData.email}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label={t('users.buttons.close')}
                  className="p-3 rounded-2xl border transition-all"
                  style={{
                    backgroundColor: inputBg,
                    borderColor,
                    color: mutedText,
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div
                className="flex-1 overflow-y-auto pt-6 pb-12 px-6 lg:px-12 space-y-8"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${borderColor} transparent`,
                }}
              >
                {error ? (
                  <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{
                      backgroundColor: `${theme.dangerColor}10`,
                      borderColor: `${theme.dangerColor}20`,
                    }}
                  >
                    <AlertCircle
                      className="w-5 h-5 shrink-0"
                      style={{ color: theme.dangerColor }}
                    />
                    <span
                      className="text-[10px] font-black uppercase flex-1"
                      style={{ color: theme.dangerColor }}
                    >
                      {error}
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <label
                      className="text-[10px] font-black uppercase tracking-widest px-1 block"
                      style={{ color: mutedText }}
                    >
                      {t('users.modals.edit.sections.personalProfile')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        placeholder={t('users.modals.add.fields.firstName')}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                      <input
                        className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        placeholder={t('users.modals.add.fields.lastName')}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                    </div>
                    <input
                      className="w-full px-5 py-4 rounded-[1.8rem] border bg-transparent focus:outline-none transition-all text-sm font-medium"
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleChange}
                      placeholder={t('users.modals.edit.placeholders.bio')}
                      style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                        name="date_of_birth"
                        value={formData.date_of_birth || ''}
                        onChange={handleChange}
                        type="date"
                        max={maxDateOfBirth}
                        aria-label={tc('demographics.dateOfBirth')}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                      <select
                        className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleChange}
                        aria-label={tc('demographics.gender.label')}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      >
                        <option value="">{tc('demographics.gender.placeholder')}</option>
                        {USER_GENDER_VALUES.map((gender) => (
                          <option key={gender} value={gender}>
                            {tc(`demographics.gender.options.${gender}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <label
                      className="text-[10px] font-black uppercase tracking-widest px-1 block"
                      style={{ color: mutedText }}
                    >
                      {t('users.modals.edit.sections.contactLocation')}
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
                        style={{ color: textColor }}
                      />
                      <input
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder={t('users.modals.edit.fields.phone')}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <MapPin
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
                          style={{ color: textColor }}
                        />
                        <input
                          className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                          name="location"
                          value={formData.location || ''}
                          onChange={handleChange}
                          placeholder={t('users.modals.edit.fields.location')}
                          style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        />
                      </div>
                      <div className="relative">
                        <Briefcase
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
                          style={{ color: textColor }}
                        />
                        <input
                          className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                          name="job_title"
                          value={formData.job_title || ''}
                          onChange={handleChange}
                          placeholder={t('users.modals.edit.fields.jobTitle')}
                          style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label
                    className="text-[10px] font-black uppercase tracking-widest px-1 block"
                    style={{ color: mutedText }}
                  >
                    {t('users.modals.edit.sections.accessRole')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['member', 'admin', 'owner'] as const).map((role) => {
                      const isActive = formData.org_role === role

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, org_role: role }))
                          }
                          className={`relative p-5 rounded-[1.8rem] text-left transition-all border ${
                            isActive
                              ? 'scale-[1.02] shadow-2xl'
                              : 'opacity-60 grayscale hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isActive ? primaryColor : inputBg,
                            borderColor: isActive ? primaryColor : borderColor,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Shield
                              className="w-5 h-5 shrink-0"
                              style={{ color: isActive ? onPrimaryColor : mutedText }}
                              strokeWidth={2.5}
                            />
                            <span
                              className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest truncate"
                              style={{ color: isActive ? onPrimaryColor : textColor }}
                            >
                              {t(`users.roles.${role}`)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div
                className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t"
                style={{ backgroundColor: surfaceColor, borderColor }}
              >
                <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
                  <Briefcase className="w-5 h-5" style={{ color: textColor }} />
                  <span
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: textColor }}
                  >
                    {t('users.modals.edit.footerLabel')}
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                    style={{
                      color: mutedText,
                      backgroundColor: inputBg,
                      borderColor,
                    }}
                  >
                    {t('users.buttons.cancel')}
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-[2] sm:flex-none px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
                    style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                  >
                    {isSaving ? (
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: `${onPrimaryColor}4D`,
                          borderTopColor: onPrimaryColor,
                        }}
                      />
                    ) : (
                      <>
                        <span className="font-black">{t('users.buttons.save')}</span>
                        <ChevronRight className="w-4 h-4" strokeWidth={3} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
