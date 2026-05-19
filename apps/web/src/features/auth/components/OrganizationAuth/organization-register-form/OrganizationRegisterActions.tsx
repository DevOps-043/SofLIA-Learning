'use client'

import { motion } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
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
  const { t } = useTranslation('common')
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
          <Trans
            i18nKey="auth.register.acceptTerms"
            t={t}
            components={{
              terms: (
                <button
                  type="button"
                  onClick={onOpenLegalModal}
                  className="font-semibold hover:underline transition-all"
                  style={{ color: 'var(--color-legacy-60a5fa)' }}
                />
              ),
              privacy: (
                <button
                  type="button"
                  onClick={onOpenLegalModal}
                  className="font-semibold hover:underline transition-all"
                  style={{ color: 'var(--color-legacy-60a5fa)' }}
                />
              ),
            }}
          />
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
            boxShadow: `0 4px 20px -4px color-mix(in srgb, ${palette.primaryColor} 31.4%, transparent)`,
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: `0 8px 30px -4px color-mix(in srgb, ${palette.primaryColor} 37.6%, transparent)`,
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
                <span>{t('auth.register.creating')}</span>
              </>
            ) : (
              <span>{t('auth.register.submit')}</span>
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
