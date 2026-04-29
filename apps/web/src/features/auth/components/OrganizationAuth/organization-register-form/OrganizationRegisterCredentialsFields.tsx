'use client'

import type { ComponentProps, JSX } from 'react'
import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CountrySelector } from '../../CountrySelector'
import { PasswordInput } from '../../PasswordInput'
import { OrganizationRegisterField } from './OrganizationRegisterField'
import type { OrganizationRegisterCredentialsFieldsProps } from './types'

const SafePasswordInput = PasswordInput as unknown as (
  props: ComponentProps<typeof PasswordInput>
) => JSX.Element

export function OrganizationRegisterCredentialsFields({
  register,
  errors,
  palette,
  selectedCountryCode,
  dialCode,
  onCountryChange,
}: OrganizationRegisterCredentialsFieldsProps) {
  const { t } = useTranslation('common')
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="space-y-1.5"
      >
        <label
          htmlFor="phoneNumber"
          className="block text-xs font-medium uppercase tracking-wider mb-1.5"
          style={{ color: palette.textColor }}
        >
          {t('auth.register.phoneLabel')}
        </label>
        <div className="flex gap-2">
          <CountrySelector
            selectedCountryCode={selectedCountryCode}
            dialCode={dialCode}
            onCountryChange={onCountryChange}
            customStyles={{
              bgColor: palette.inputBgColor,
              borderColor: palette.borderColor,
              textColor: palette.textColor,
            }}
          />
          <div className="flex-1">
            <OrganizationRegisterField
              id="phoneNumber"
              label=""
              type="tel"
              placeholder="1234567890"
              registration={register('phoneNumber')}
              palette={palette}
              error={errors.phoneNumber?.message}
              icon={Phone}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="space-y-1.5"
        >
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: palette.textColor }}
          >
            {t('auth.register.passwordLabel')}
          </label>
          <SafePasswordInput
            id="password"
            placeholder="********"
            error={errors.password?.message}
            customColors={{
              bgColor: palette.inputBgColor,
              borderColor: palette.borderColor,
              textColor: palette.textColor,
            }}
            {...register('password')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-1.5"
        >
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: palette.textColor }}
          >
            {t('auth.register.confirmPasswordLabel')}
          </label>
          <SafePasswordInput
            id="confirmPassword"
            placeholder="********"
            error={errors.confirmPassword?.message}
            customColors={{
              bgColor: palette.inputBgColor,
              borderColor: palette.borderColor,
              textColor: palette.textColor,
            }}
            {...register('confirmPassword')}
          />
        </motion.div>
      </div>
    </>
  )
}
