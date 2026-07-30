'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lock, Mail, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '../../../../lib/utils/motion'
import { PremiumPassword } from './ProfilePremiumFields'
import type { ProfileColorPalette, UserProfile } from '../../types/profile.types'
import styles from './ProfileExperience.module.css'

interface PasswordErrors {
  current_password?: { message?: string }
  new_password?: { message?: string }
  confirm_password?: { message?: string }
}

interface ProfileSecurityTabProps {
  profile: UserProfile
  colors: ProfileColorPalette
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
  profile,
  colors,
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
  const emailStatusColor = profile.email_verified ? colors.success : colors.warning

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.securityGrid}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0, y: 12 }}
      key="security"
      transition={interfaceTransition}
    >
      <aside className={styles.emailCard}>
        <span className={styles.emailIcon}>
          <Mail className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className={styles.emailLabel}>{t('profile.security.email')}</p>
        <p className={styles.emailValue}>
          {profile.email || t('profile.security.emailUnavailable')}
        </p>
        <div
          className={styles.emailStatus}
          style={{
            backgroundColor: `color-mix(in srgb, ${emailStatusColor} 10%, transparent)`,
            color: emailStatusColor,
          }}
        >
          {profile.email_verified ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {profile.email_verified ? t('profile.security.emailVerified') : t('profile.security.emailUnverified')}
        </div>
      </aside>

      <section className={styles.passwordCard}>
        <div className={styles.securityTitle}>
          <span className={styles.sectionIcon}>
            <Shield className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className={styles.sectionHeading}>{t('profile.security.passwordSection')}</h2>
            <p className={styles.sectionDescription}>{t('profile.security.passwordDescription')}</p>
          </div>
        </div>

        <div className={styles.passwordFields}>
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

        <div className={styles.passwordActions}>
          <motion.button
            className={styles.passwordButton}
            disabled={isPasswordSubmitDisabled}
            onClick={() => void handleChangePassword()}
            type="button"
            whileTap={isPasswordSubmitDisabled ? undefined : { scale: 0.98 }}
          >
            {isChangingPassword ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <Lock className="h-4 w-4" aria-hidden="true" />
            )}
            {isChangingPassword ? t('profile.security.updating') : t('profile.security.updatePassword')}
          </motion.button>
        </div>
      </section>
    </motion.div>
  )
}
