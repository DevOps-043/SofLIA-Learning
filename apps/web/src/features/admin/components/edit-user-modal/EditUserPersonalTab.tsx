'use client'

import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  FlagIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { EditUserFormData } from './types'
import { USER_GENDER_VALUES } from '../../../../lib/schemas/user-demographics.schema'

interface EditUserPersonalTabProps {
  formData: EditUserFormData
  onFieldChange: (
    name: keyof EditUserFormData,
    value: string | boolean,
    inputType?: string,
  ) => void
}

export function EditUserPersonalTab({
  formData,
  onFieldChange,
}: EditUserPersonalTabProps) {
  const { t } = useTranslation(['admin', 'common'])
  const maxDateOfBirth = new Date().toISOString().slice(0, 10)

  return (
    <motion.div
      key="personal"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.username')} *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                onFieldChange('username', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.email')} *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFieldChange('email', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.firstName')}
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) =>
              onFieldChange('first_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.lastName')}
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) =>
              onFieldChange('last_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.displayName')}
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) =>
              onFieldChange('display_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('demographics.dateOfBirth')}
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            max={maxDateOfBirth}
            onChange={(e) =>
              onFieldChange('date_of_birth', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-cyan-400/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('demographics.gender.label')}
          </label>
          <select
            value={formData.gender}
            onChange={(e) => onFieldChange('gender', e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-cyan-400/40 focus:border-transparent transition-all duration-200"
          >
            <option value="">{t('demographics.gender.placeholder')}</option>
            {USER_GENDER_VALUES.map((gender) => (
              <option key={gender} value={gender}>
                {t(`demographics.gender.options.${gender}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.phone')}
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                onFieldChange('phone', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.location')}
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                onFieldChange('location', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.countryCode')}
          </label>
          <div className="relative">
            <FlagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={formData.country_code}
              onChange={(e) =>
                onFieldChange('country_code', e.target.value, e.target.type)
              }
              placeholder="MX, US, etc."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          {t('admin:users.demographics.bio')}
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => onFieldChange('bio', e.target.value, e.target.type)}
          rows={3}
          className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder={t('admin:users.demographics.bioPlaceholder')}
        />
      </div>
    </motion.div>
  )
}
