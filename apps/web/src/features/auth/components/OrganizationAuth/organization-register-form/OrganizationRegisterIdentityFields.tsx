'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Mail, Shield, User } from 'lucide-react'
import { OrganizationRegisterField } from './OrganizationRegisterField'
import type { OrganizationRegisterIdentityFieldsProps } from './types'

export function OrganizationRegisterIdentityFields({
  register,
  errors,
  palette,
  invitedEmail,
  invitedRole,
  invitedRoleLabel,
  bulkInviteToken,
  success,
}: OrganizationRegisterIdentityFieldsProps) {
  return (
    <>
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h2
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: palette.textColor }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        >
          Crear cuenta
        </motion.h2>
        <motion.p
          className="text-base font-normal opacity-70"
          style={{ color: palette.textColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Unete a la organizacion
        </motion.p>
      </motion.div>

      {success ? (
        <motion.div
          className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {success}
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="firstName"
            label="Nombre"
            type="text"
            placeholder="Juan"
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
            label="Apellido"
            type="text"
            placeholder="Perez"
            registration={register('lastName')}
            palette={palette}
            error={errors.lastName?.message}
            icon={User}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <OrganizationRegisterField
          id="username"
          label="Usuario"
          type="text"
          placeholder="juanperez"
          registration={register('username')}
          palette={palette}
          error={errors.username?.message}
        />
      </motion.div>

      {invitedRole && invitedRoleLabel ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Seras registrado como: <strong>{invitedRoleLabel}</strong>
              {bulkInviteToken ? (
                <span className="ml-1 text-xs opacity-70">
                  (via enlace de invitacion)
                </span>
              ) : null}
            </p>
          </div>
        </motion.div>
      ) : null}

      <div className={`grid grid-cols-1 ${invitedEmail ? '' : 'md:grid-cols-2'} gap-4`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <OrganizationRegisterField
            id="email"
            label="Correo Electronico"
            type="email"
            placeholder="tu@email.com"
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
              invitedEmail ? 'Este email esta asociado a tu invitacion' : undefined
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
              label="Confirmar Correo"
              type="email"
              placeholder="tu@email.com"
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
