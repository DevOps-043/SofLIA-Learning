'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lock, Mail, Shield } from 'lucide-react'
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

  return (
    <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <AnimatePresence>
        {passwordChangeSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: `${colors.success}15`, border: `1px solid ${colors.success}30` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.success}20` }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: colors.success }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: colors.success }}>¡Contraseña actualizada!</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{passwordChangeSuccess}</p>
            </div>
          </motion.div>
        ) : null}

        {passwordChangeError ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: `${colors.error}15`, border: `1px solid ${colors.error}30` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.error}20` }}>
              <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: colors.error }}>Error</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{passwordChangeError}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumInput label="Correo Electrónico" value={formData.email || ''} onChange={value => handleInputChange('email', value)} icon={<Mail className="w-4 h-4" />} type="email" colors={colors} />
      </div>

      <div className="pt-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${colors.accent}15` }}>
          <Shield className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: colors.text }}>Cambiar Contraseña</h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Asegúrate de usar una contraseña segura</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumPassword
          label="Contraseña Actual"
          value={currentPassword}
          onChange={value => setPasswordValue('current_password', value)}
          show={showCurrentPassword}
          onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
          error={passwordErrors.current_password?.message}
          colors={colors}
        />
        <PremiumPassword
          label="Nueva Contraseña"
          value={newPassword}
          onChange={value => setPasswordValue('new_password', value)}
          show={showNewPassword}
          onToggle={() => setShowNewPassword(!showNewPassword)}
          error={passwordErrors.new_password?.message}
          colors={colors}
        />
        <PremiumPassword
          label="Confirmar Contraseña"
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
            boxShadow: isPasswordSubmitDisabled ? 'none' : `0 10px 30px ${colors.accent}30`
          }}
          whileHover={isPasswordSubmitDisabled ? undefined : { scale: 1.02, boxShadow: `0 15px 40px ${colors.accent}40` }}
          whileTap={isPasswordSubmitDisabled ? undefined : { scale: 0.98 }}
        >
          {isChangingPassword ? (
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
        </motion.button>
      </div>
    </motion.div>
  )
}
