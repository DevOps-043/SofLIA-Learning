'use client'

import { motion } from 'framer-motion'
import { SocialLoginButtons } from '../../SocialLoginButtons/SocialLoginButtons'
import type { OrganizationRegisterActionsProps } from './types'

export function OrganizationRegisterActions({
  register,
  errors,
  palette,
  isPending,
  organizationId,
  organizationSlug,
  invitationToken,
  bulkInviteToken,
  googleLoginEnabled,
  microsoftLoginEnabled,
  onOpenLegalModal,
}: OrganizationRegisterActionsProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex items-start gap-3"
      >
        <input
          id="acceptTerms"
          type="checkbox"
          {...register('acceptTerms')}
          className="auth-checkbox mt-1"
        />
        <label
          htmlFor="acceptTerms"
          className="text-sm cursor-pointer"
          style={{ color: palette.textColor }}
        >
          Acepto los{' '}
          <button
            type="button"
            onClick={onOpenLegalModal}
            className="font-semibold hover:underline transition-all"
            style={{ color: '#60a5fa' }}
          >
            terminos y condiciones
          </button>{' '}
          y la{' '}
          <button
            type="button"
            onClick={onOpenLegalModal}
            className="font-semibold hover:underline transition-all"
            style={{ color: '#60a5fa' }}
          >
            politica de privacidad
          </button>
        </label>
      </motion.div>

      {errors.acceptTerms ? (
        <p className="auth-error">{errors.acceptTerms.message}</p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="pt-2"
      >
        <motion.button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: palette.primaryColor,
            boxShadow: `0 4px 20px -4px ${palette.primaryColor}50`,
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: `0 8px 30px -4px ${palette.primaryColor}60`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          {isPending ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Creando cuenta...</span>
            </>
          ) : (
            <span>Crear cuenta</span>
          )}
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <SocialLoginButtons
          googleEnabled={googleLoginEnabled}
          microsoftEnabled={microsoftLoginEnabled}
          organizationSlug={organizationSlug}
          organizationId={organizationId}
          invitationToken={invitationToken || undefined}
          bulkInviteToken={bulkInviteToken || undefined}
          showLoginLink
        />
      </motion.div>
    </>
  )
}
