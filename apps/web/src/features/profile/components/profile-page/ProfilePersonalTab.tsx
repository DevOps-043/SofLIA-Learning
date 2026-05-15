'use client'

import { motion } from 'framer-motion'
import { AtSign, Briefcase, MapPin, Phone, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { USER_GENDER_VALUES } from '../../../../lib/schemas/user-demographics.schema'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { PremiumDateInput, PremiumInput, PremiumSelect, PremiumTextarea } from './ProfilePremiumFields'
import type { ProfileColorPalette, UpdateProfileRequest } from '../../types/profile.types'

interface ProfilePersonalTabProps {
  formData: UpdateProfileRequest
  handleInputChange: (field: keyof UpdateProfileRequest, value: string) => void
  colors: ProfileColorPalette
}

export function ProfilePersonalTab({ formData, handleInputChange, colors }: ProfilePersonalTabProps) {
  const { t } = useTranslation('common')
  const { interfaceTransition } = useMotionSafe()
  const maxDateOfBirth = new Date().toISOString().slice(0, 10)
  const genderOptions = USER_GENDER_VALUES.map(gender => ({
    value: gender,
    label: t(`demographics.gender.options.${gender}`)
  }))

  return (
    <motion.div key="personal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={interfaceTransition} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumInput label={t('profile.personal.firstName')} value={formData.first_name || ''} onChange={value => handleInputChange('first_name', value)} icon={<User className="w-4 h-4" />} colors={colors} />
        <PremiumInput label={t('profile.personal.lastName')} value={formData.last_name || ''} onChange={value => handleInputChange('last_name', value)} icon={<User className="w-4 h-4" />} colors={colors} />
        <PremiumInput label={t('profile.personal.username')} value={formData.username || ''} onChange={value => handleInputChange('username', value)} icon={<AtSign className="w-4 h-4" />} colors={colors} />
        <PremiumInput label={t('profile.personal.role')} value={formData.job_title || ''} onChange={value => handleInputChange('job_title', value)} icon={<Briefcase className="w-4 h-4" />} colors={colors} />
        <PremiumInput label={t('profile.personal.phone')} value={formData.phone || ''} onChange={value => handleInputChange('phone', value)} icon={<Phone className="w-4 h-4" />} type="tel" colors={colors} />
        <PremiumInput label={t('profile.personal.location')} value={formData.location || ''} onChange={value => handleInputChange('location', value)} icon={<MapPin className="w-4 h-4" />} colors={colors} />
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          {t('demographics.sectionTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PremiumDateInput label={t('demographics.dateOfBirth')} value={formData.date_of_birth || ''} onChange={value => handleInputChange('date_of_birth', value)} max={maxDateOfBirth} colors={colors} />
          <PremiumSelect label={t('demographics.gender.label')} value={formData.gender || ''} onChange={value => handleInputChange('gender', value)} options={genderOptions} placeholder={t('demographics.gender.placeholder')} colors={colors} />
        </div>
      </section>

      <PremiumTextarea label={t('profile.personal.roleDescription')} value={formData.job_description || ''} onChange={value => handleInputChange('job_description', value)} maxLength={1000} rows={5} colors={colors} />
      <PremiumTextarea label={t('profile.personal.bio')} value={formData.bio || ''} onChange={value => handleInputChange('bio', value)} maxLength={500} rows={4} colors={colors} />
    </motion.div>
  )
}
