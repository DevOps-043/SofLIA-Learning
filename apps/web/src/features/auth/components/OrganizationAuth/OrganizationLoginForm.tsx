'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, Eye, EyeOff, Lock, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons'
import { useOrganizationAuthStyles } from './useOrganizationAuthStyles'
import {
  formatRedirectCountdownMessage,
  useOrganizationLoginForm,
} from './organization-login-form'

interface OrganizationLoginFormProps {
  organizationId: string
  organizationSlug: string
  googleLoginEnabled?: boolean
  microsoftLoginEnabled?: boolean
}

export function OrganizationLoginForm({
  organizationId,
  organizationSlug,
  googleLoginEnabled,
  microsoftLoginEnabled,
}: OrganizationLoginFormProps) {
  const router = useRouter()
  const { palette } = useOrganizationAuthStyles(organizationSlug)
  const {
    bulkInviteToken,
    error,
    focusedField,
    form,
    invitationToken,
    isPending,
    onSubmit,
    redirectInfo,
    setFocusedField,
    setShowPassword,
    showPassword,
  } = useOrganizationLoginForm({
    organizationId,
    organizationSlug,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form
  const rememberMe = watch('rememberMe')

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div
          className="text-center space-y-2 mb-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: palette.textColor }}
          >
            Bienvenido de vuelta
          </h2>
          <p
            className="text-sm opacity-70 font-normal"
            style={{ color: palette.textColor }}
          >
            Ingresa a tu cuenta para continuar
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="relative overflow-hidden rounded-xl backdrop-blur-sm border p-4"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm text-red-300 font-medium leading-snug">{error}</p>
                  {redirectInfo && (
                    <div className="flex items-center gap-2 pt-2 border-t border-red-500/20">
                      <motion.div
                        className="w-3 h-3 rounded-full border-2 border-red-400/60 border-t-red-400"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                      <p className="text-xs text-red-300/80 flex-1">
                        {formatRedirectCountdownMessage(
                          redirectInfo.message,
                          redirectInfo.countdown,
                        )}
                      </p>
                      {redirectInfo.countdown > 0 && (
                        <motion.span
                          key={redirectInfo.countdown}
                          className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-md text-xs font-semibold text-red-200"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {redirectInfo.countdown}
                        </motion.span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <label
            htmlFor="emailOrUsername"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200"
            style={{
              color:
                focusedField === 'emailOrUsername'
                  ? palette.focusColor
                  : palette.textColor,
              opacity: focusedField === 'emailOrUsername' ? 1 : 0.7,
            }}
          >
            Correo o Usuario
          </label>
          <div className="relative group">
            <motion.div
              className="relative rounded-xl border transition-all duration-300 overflow-hidden"
              style={{
                backgroundColor:
                  focusedField === 'emailOrUsername'
                    ? palette.inputBgColor
                    : palette.inputBgColor,
                borderColor:
                  focusedField === 'emailOrUsername'
                    ? palette.focusColor
                    : errors.emailOrUsername
                      ? '#ef4444'
                      : palette.borderColor,
                borderWidth: focusedField === 'emailOrUsername' ? '2px' : '1px',
                boxShadow:
                  focusedField === 'emailOrUsername'
                    ? `0 0 0 3px ${palette.focusColor}20, 0 4px 12px -2px rgba(0, 0, 0, 0.2)`
                    : 'none',
              }}
              animate={{ scale: focusedField === 'emailOrUsername' ? 1.005 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {focusedField === 'emailOrUsername' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: palette.focusColor }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="flex items-center px-4 py-3">
                <Mail
                  className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                  style={{
                    color:
                      focusedField === 'emailOrUsername'
                        ? palette.focusColor
                        : `${palette.textColor}50`,
                  }}
                />
                <input
                  id="emailOrUsername"
                  type="text"
                  placeholder="tu@email.com o usuario"
                  {...register('emailOrUsername')}
                  onFocus={() => setFocusedField('emailOrUsername')}
                  onBlur={() => setFocusedField(null)}
                  className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                  style={{ color: palette.textColor }}
                />
              </div>
            </motion.div>
          </div>
          <FieldError message={errors.emailOrUsername?.message} />
        </motion.div>

        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200"
            style={{
              color:
                focusedField === 'password' ? palette.focusColor : palette.textColor,
              opacity: focusedField === 'password' ? 1 : 0.7,
            }}
          >
            Contraseña
          </label>
          <div className="relative group">
            <motion.div
              className="relative rounded-xl border transition-all duration-300 overflow-hidden"
              style={{
                backgroundColor: palette.inputBgColor,
                borderColor:
                  focusedField === 'password'
                    ? palette.focusColor
                    : errors.password
                      ? '#ef4444'
                      : palette.borderColor,
                borderWidth: focusedField === 'password' ? '2px' : '1px',
                boxShadow:
                  focusedField === 'password'
                    ? `0 0 0 3px ${palette.focusColor}20, 0 4px 12px -2px rgba(0, 0, 0, 0.2)`
                    : 'none',
              }}
              animate={{ scale: focusedField === 'password' ? 1.005 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {focusedField === 'password' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: palette.focusColor }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="flex items-center px-4 py-3">
                <Lock
                  className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                  style={{
                    color:
                      focusedField === 'password'
                        ? palette.focusColor
                        : `${palette.textColor}50`,
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest"
                  style={{
                    color: palette.textColor,
                    letterSpacing: '0.15em',
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 hover:opacity-70"
                  style={{
                    color:
                      focusedField === 'password'
                        ? palette.focusColor
                        : `${palette.textColor}50`,
                    backgroundColor:
                      focusedField === 'password'
                        ? `${palette.focusColor}15`
                        : 'transparent',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
            </motion.div>
          </div>
          <FieldError message={errors.password?.message} />
        </motion.div>

        <motion.div
          className="w-full flex items-center justify-between pt-1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <motion.label
            className="flex items-center gap-2.5 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex items-center justify-center">
              <input type="checkbox" {...register('rememberMe')} className="sr-only" />
              <motion.div
                className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 overflow-hidden"
                style={{
                  borderColor: rememberMe ? palette.primaryColor : palette.borderColor,
                  backgroundColor: rememberMe ? palette.primaryColor : 'transparent',
                }}
                animate={{ scale: rememberMe ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence>
                  {rememberMe && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.2, type: 'spring' }}
                    >
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            <span
              className="text-xs font-medium transition-colors select-none"
              style={{
                color: palette.textColor,
                opacity: rememberMe ? 1 : 0.7,
              }}
            >
              Recordarme
            </span>
          </motion.label>

          <button
            type="button"
            onClick={() => router.push('/auth/forgot-password')}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: palette.primaryColor }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </motion.div>

        <motion.div
          className="pt-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.button
            type="submit"
            disabled={isPending}
            className="w-full relative overflow-hidden group rounded-xl py-3.5 px-5 font-semibold text-sm text-white transition-all duration-300 border-0"
            style={{
              backgroundColor: palette.primaryColor,
              boxShadow: `0 4px 14px -2px ${palette.primaryColor}40`,
            }}
            whileHover={{
              scale: 1.01,
              boxShadow: `0 6px 20px -2px ${palette.primaryColor}50`,
            }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isPending ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-xs">Ingresando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </span>
          </motion.button>
        </motion.div>
      </form>

      {(googleLoginEnabled || microsoftLoginEnabled) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6"
        >
          <SocialLoginButtons
            googleEnabled={googleLoginEnabled}
            microsoftEnabled={microsoftLoginEnabled}
            organizationSlug={organizationSlug}
            organizationId={organizationId}
            invitationToken={invitationToken || undefined}
            bulkInviteToken={bulkInviteToken || undefined}
          />
        </motion.div>
      )}
    </>
  )
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          className="text-xs text-red-400 flex items-center gap-1.5 px-1 mt-1"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}
