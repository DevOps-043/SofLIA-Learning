'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, CheckCircle, Mail, ShieldCheck, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { USER_GENDER_VALUES } from '../../../../../lib/schemas/user-demographics.schema'
import type { RegisterFormData } from '../../../types/auth.types'
import { OrganizationRegisterDatePicker } from './OrganizationRegisterDatePicker'
import { OrganizationRegisterField } from './OrganizationRegisterField'
import { OrganizationRegisterDropdown } from './OrganizationRegisterDropdown'
import type { OrganizationRegisterIdentityFieldsProps } from './types'

export function OrganizationRegisterIdentityFields({
  register,
  errors,
  palette,
  invitedEmail,
  invitedRole,
  bulkInviteToken,
  success,
}: OrganizationRegisterIdentityFieldsProps) {
  const showJobTitleField = !!invitedRole || !!bulkInviteToken
  const { t } = useTranslation('common')
  const maxDateOfBirth = useMemo(() => new Date(), [])

  const genderOptions = useMemo(
    () =>
      USER_GENDER_VALUES.map((gender) => ({
        value: gender,
        label: t(`demographics.gender.options.${gender}`),
      })),
    [t],
  )

  const { watch, setValue } = useFormContext<RegisterFormData>()
  const genderValue = watch('gender')
  const dateOfBirthValue = watch('dateOfBirth')

  return (
    <>
      <motion.header
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <motion.h2
            className="text-2xl font-bold tracking-tight lg:text-[28px]"
            style={{ color: palette.textColor }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          >
            {t('auth.register.title')}
          </motion.h2>
          <motion.p
            className="mt-1 text-sm font-normal opacity-60"
            style={{ color: palette.textColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {t('auth.register.subtitle')}
          </motion.p>
        </div>

      </motion.header>

      {invitedRole ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${palette.focusColor} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${palette.focusColor} 20%, transparent)`,
            color: palette.textColor,
          }}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: palette.focusColor }} />
          <span>
            {t('auth.org.platformRoleLabel')}{' '}
            <strong style={{ color: palette.focusColor }}>
              {t(`auth.roles.${invitedRole}`, { defaultValue: invitedRole })}
            </strong>
          </span>
        </div>
      ) : null}

      {success ? (
        <motion.div
          className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {success}
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="firstName"
            label={t('auth.register.firstNameLabel')}
            type="text"
            placeholder={t('auth.register.firstNamePlaceholder')}
            registration={register('firstName')}
            palette={palette}
            error={errors.firstName?.message}
            icon={User}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="lastName"
            label={t('auth.register.lastNameLabel')}
            type="text"
            placeholder={t('auth.register.lastNamePlaceholder')}
            registration={register('lastName')}
            palette={palette}
            error={errors.lastName?.message}
            icon={User}
          />
        </motion.div>
        <motion.div
          className={showJobTitleField ? undefined : 'md:col-span-2'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="username"
            label={t('auth.register.usernameLabel')}
            type="text"
            placeholder={t('auth.register.usernamePlaceholder')}
            registration={register('username')}
            palette={palette}
            error={errors.username?.message}
          />
        </motion.div>

        {showJobTitleField ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <OrganizationRegisterField
              id="cargo_titulo"
              label={t('auth.register.jobTitleLabel')}
              type="text"
              placeholder={t('auth.register.jobTitlePlaceholder')}
              registration={register('cargo_titulo')}
              palette={palette}
              error={errors.cargo_titulo?.message}
              icon={Briefcase}
            />
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <OrganizationRegisterDatePicker
            id="dateOfBirth"
            label={t('demographics.dateOfBirth')}
            value={dateOfBirthValue}
            onChange={(date) =>
              setValue('dateOfBirth', date, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            registration={register('dateOfBirth')}
            palette={palette}
            error={errors.dateOfBirth?.message}
            maxDate={maxDateOfBirth}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <OrganizationRegisterDropdown
            id="gender"
            label={t('demographics.gender.label')}
            options={genderOptions}
            placeholder={t('demographics.gender.placeholder')}
            value={genderValue}
            onChange={(val) =>
              setValue('gender', val as RegisterFormData['gender'], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            palette={palette}
            error={errors.gender?.message}
          />
        </motion.div>

        <motion.div
          className={invitedEmail ? 'md:col-span-2' : undefined}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="email"
            label={t('auth.register.emailLabel')}
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            registration={register('email')}
            palette={{
              ...palette,
              inputBgColor: invitedEmail
                ? palette.isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)'
                : palette.inputBgColor,
            }}
            error={errors.email?.message}
            icon={Mail}
            disabled={!!invitedEmail}
            readOnly={!!invitedEmail}
            onPaste={(event) => {
              if (!invitedEmail) {
                event.preventDefault()
              }
            }}
            helperText={
              invitedEmail ? t('auth.org.emailAssociatedInvite') : undefined
            }
            rightAdornment={
              invitedEmail ? (
                <div className="flex items-center gap-1 ml-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              ) : undefined
            }
          />
        </motion.div>

        {!invitedEmail ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <OrganizationRegisterField
              id="confirmEmail"
              label={t('auth.register.confirmEmailLabel')}
              type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              registration={register('confirmEmail')}
              palette={palette}
              error={errors.confirmEmail?.message}
              icon={Mail}
              onPaste={(event) => event.preventDefault()}
            />
          </motion.div>
        ) : null}
      </div>
    </>
  )
}
