'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline'
import { RoleSelect } from './RoleSelect'
import type { EditUserFormData } from './types'

interface EditUserAccountTabProps {
  formData: EditUserFormData
  onFieldChange: (
    name: keyof EditUserFormData,
    value: string | boolean,
    inputType?: string,
  ) => void
}

export function EditUserAccountTab({
  formData,
  onFieldChange,
}: EditUserAccountTabProps) {
  const { t } = useTranslation('admin')
  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleSelect
          value={formData.cargo_rol}
          onChange={(value) => onFieldChange('cargo_rol', value)}
        />

        <div>
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('users.demographics.roleType')}
          </label>
          <input
            type="text"
            value={formData.type_rol}
            onChange={(e) =>
              onFieldChange('type_rol', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('users.demographics.points')}
          </label>
          <div className="relative">
            <StarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="number"
              value={formData.points}
              onChange={(e) =>
                onFieldChange('points', e.target.value, e.target.type)
              }
              min="0"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.email_verified}
              onChange={(e) =>
                onFieldChange('email_verified', e.target.checked, e.target.type)
              }
              className="sr-only"
            />
            <motion.div
              animate={{
                backgroundColor: formData.email_verified ? '#00D4B3' : '#E9ECEF',
                borderColor: formData.email_verified ? '#00D4B3' : '#E9ECEF',
              }}
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
            >
              {formData.email_verified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          </div>
          <div>
            <span className="text-sm font-medium text-[#0A2540] dark:text-white">
              {t('users.demographics.emailVerified')}
            </span>
            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
              {t('users.demographics.emailVerifiedDesc')}
            </p>
          </div>
        </label>
      </motion.div>
    </motion.div>
  )
}
