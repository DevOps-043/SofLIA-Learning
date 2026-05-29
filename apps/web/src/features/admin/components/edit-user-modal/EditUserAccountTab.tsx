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
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.roleType')}
          </label>
          <input
            type="text"
            value={formData.type_rol}
            onChange={(e) =>
              onFieldChange('type_rol', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
            {t('admin:users.demographics.points')}
          </label>
          <div className="relative">
            <StarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
            <input
              type="number"
              value={formData.points}
              onChange={(e) =>
                onFieldChange('points', e.target.value, e.target.type)
              }
              min="0"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="p-4 bg-gray-200/50 dark:bg-carbon-950 rounded-xl border border-gray-200 dark:border-gray-500/30"
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
                backgroundColor: formData.email_verified ? 'var(--color-accent)' : 'var(--color-gray-200)',
                borderColor: formData.email_verified ? 'var(--color-accent)' : 'var(--color-gray-200)',
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
            <span className="text-sm font-medium text-primary dark:text-white">
              {t('admin:users.demographics.emailVerified')}
            </span>
            <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">
              {t('admin:users.demographics.emailVerifiedDesc')}
            </p>
          </div>
        </label>
      </motion.div>
    </motion.div>
  )
}
