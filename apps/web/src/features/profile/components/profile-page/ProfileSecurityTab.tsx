'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lock, Mail, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { PremiumInput, PremiumPassword } from './ProfilePremiumFields'
import type { ProfileColorPalette, UpdateProfileRequest } from '../../types/profile.types'

interface PasswordErrors {
  current_password?: { message?: string }
  new_password?: { message?: string }
  confirm_password?: { message?: string }
}

interface ProfileSecurityTabProps {
  formData: UpdateProfileRequest
  handleInputChange: (field: keyof UpdateProfileRequest, value: string) => void
  colors: ProfileColorPalette
  passwordChangeSuccess: string | null
  passwordChangeError: string | null
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrentPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
  setShowCurrentPassword: (value: boolean) => void
  setShowNewPassword: (value: boolean) => void
  setShowConfirmPassword: (value: boolean) => void
  setPasswordValue: (name: 'current_password' | 'new_password' | 'confirm_password', value: string) => void
  passwordErrors: PasswordErrors
  isChangingPassword: boolean
  handleChangePassword: () => Promise<void>
}

export function ProfileSecurityTab({
  formData,
  handleInputChange,
  colors,
  passwordChangeSuccess,
  passwordChangeError,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  setPasswordValue,
  passwordErrors,
  isChangingPassword,
  handleChangePassword
}: ProfileSecurityTabProps) {
  const isPasswordSubmitDisabled = isChangingPassword || !currentPassword || !newPassword || !confirmPassword
  const { t } = useTranslation('common')
  const { interfaceTransition } = useMotionSafe()

  return (
    <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={interfaceTransition} className="space-y-6">
      <AnimatePresence>
        {passwordChangeSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={interfaceTransition}
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: `color-mix(in srgb, ${colors.success} 8.2%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.success} 18.8%, transparent)` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${colors.success} 12.5%, transparent)` }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: colors.success }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: colors.success }}>{t('profile.security.passwordUpdated')}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{passwordChangeSuccess}</p>
            </div>
          </motion.div>
        ) : null}

        {passwordChangeError ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={interfaceTransition}
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: `color-mix(in srgb, ${colors.error} 8.2%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.error} 18.8%, transparent)` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${colors.error} 12.5%, transparent)` }}>
              <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: colors.error }}>{t('profile.security.error')}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{passwordChangeError}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumInput label={t('profile.security.email')} value={formData.email || ''} onChange={value => handleInputChange('email', value)} icon={<Mail className="w-4 h-4" />} type="email" colors={colors} />
      </div>

      <div className="pt-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 8.2%, transparent)` }}>
          <Shield className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: colors.text }}>{t('profile.security.passwordSection')}</h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{t('profile.security.passwordDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumPassword
          label={t('profile.security.currentPassword')}
          value={currentPassword}
          onChange={value => setPasswordValue('current_password', value)}
          show={showCurrentPassword}
          onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
          error={passwordErrors.current_password?.message}
          colors={colors}
        />
        <PremiumPassword
          label={t('profile.security.newPassword')}
          value={newPassword}
          onChange={value => setPasswordValue('new_password', value)}
          show={showNewPassword}
          onToggle={() => setShowNewPassword(!showNewPassword)}
          error={passwordErrors.new_password?.message}
          colors={colors}
        />
        <PremiumPassword
          label={t('profile.security.confirmPassword')}
          value={confirmPassword}
          onChange={value => setPasswordValue('confirm_password', value)}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          error={passwordErrors.confirm_password?.message}
          colors={colors}
        />
      </div>

      <div className="flex justify-end pt-2">
        <motion.button
          onClick={() => void handleChangePassword()}
          disabled={isPasswordSubmitDisabled}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300"
          style={{
            backgroundColor: isPasswordSubmitDisabled ? 'rgba(255,255,255,0.05)' : colors.accent,
            color: isPasswordSubmitDisabled ? 'rgba(255,255,255,0.3)' : colors.primary,
            boxShadow: isPasswordSubmitDisabled ? 'none' : `0 10px 30px color-mix(in srgb, ${colors.accent} 18.8%, transparent)`
          }}
          whileHover={isPasswordSubmitDisabled ? undefined : { scale: 1.02, boxShadow: `0 15px 40px color-mix(in srgb, ${colors.accent} 25.1%, transparent)` }}
          whileTap={isPasswordSubmitDisabled ? undefined : { scale: 0.98 }}
        >
          {isChangingPassword ? (
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `color-mix(in srgb, ${colors.primary} 18.8%, transparent)`, borderTopColor: colors.primary }} />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          {isChangingPassword ? t('profile.security.updating') : t('profile.security.updatePassword')}
        </motion.button>
      </div>
    </motion.div>
  )
}
