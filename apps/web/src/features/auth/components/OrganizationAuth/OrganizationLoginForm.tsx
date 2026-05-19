'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons'
import { HumanVerificationField } from '../HumanVerificationField'
import { MfaChallengeForm } from '../LoginForm/MfaChallengeForm'
import { useOrganizationAuthStyles } from './useOrganizationAuthStyles'
import {
  formatRedirectCountdownMessage,
  useOrganizationLoginForm,
} from './organization-login-form'
import { OrganizationLoginEmailField } from './organization-login-form/OrganizationLoginEmailField'
import { OrganizationLoginErrorAlert } from './organization-login-form/OrganizationLoginErrorAlert'
import { OrganizationLoginOptionsRow } from './organization-login-form/OrganizationLoginOptionsRow'
import { OrganizationLoginPasswordField } from './organization-login-form/OrganizationLoginPasswordField'
import { OrganizationLoginSubmitButton } from './organization-login-form/OrganizationLoginSubmitButton'

interface OrganizationLoginFormProps {
  googleLoginEnabled?: boolean
  microsoftLoginEnabled?: boolean
  organizationId: string
  organizationSlug: string
}

export function OrganizationLoginForm(props: OrganizationLoginFormProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { palette } = useOrganizationAuthStyles(props.organizationSlug)
  const login = useOrganizationLoginForm({
    organizationId: props.organizationId,
    organizationSlug: props.organizationSlug,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = login.form

  if (login.mfaChallengeToken) {
    return (
      <div className="space-y-5">
        <OrganizationLoginErrorAlert
          error={login.error}
          formatRedirectCountdownMessage={formatRedirectCountdownMessage}
          redirectInfo={login.redirectInfo}
        />
        <MfaChallengeForm
          code={login.mfaCode}
          isPending={login.isPending}
          onBack={login.resetMfaChallenge}
          onCodeChange={login.setMfaCode}
          onSubmit={login.onMfaSubmit}
          t={t}
        />
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(login.onSubmit)} className="space-y-5" aria-busy={login.isPending}>
        <motion.div className="text-center space-y-2 mb-7" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: palette.textColor }}>
            {t('auth.org.welcomeBack')}
          </h2>
          <p className="text-sm opacity-70 font-normal" style={{ color: palette.textColor }}>
            {t('auth.org.signInToContinue')}
          </p>
        </motion.div>
        <OrganizationLoginErrorAlert
          error={login.error}
          formatRedirectCountdownMessage={formatRedirectCountdownMessage}
          redirectInfo={login.redirectInfo}
        />
        <OrganizationLoginEmailField
          errors={errors}
          focusedField={login.focusedField}
          isPending={login.isPending}
          palette={palette}
          register={register}
          setFocusedField={login.setFocusedField}
        />
        <OrganizationLoginPasswordField
          errors={errors}
          focusedField={login.focusedField}
          isPending={login.isPending}
          palette={palette}
          register={register}
          setFocusedField={login.setFocusedField}
          setShowPassword={login.setShowPassword}
          showPassword={login.showPassword}
        />
        <OrganizationLoginOptionsRow
          palette={palette}
          register={register}
          rememberMe={watch('rememberMe')}
          router={router}
        />
        <HumanVerificationField onTokenChange={login.setCaptchaToken} />
        <OrganizationLoginSubmitButton isPending={login.isPending} palette={palette} />
      </form>
      {(props.googleLoginEnabled || props.microsoftLoginEnabled) && (
        <SocialLoginButtons
          googleEnabled={props.googleLoginEnabled}
          microsoftEnabled={props.microsoftLoginEnabled}
          organizationSlug={props.organizationSlug}
          organizationId={props.organizationId}
          invitationToken={login.invitationToken || undefined}
          bulkInviteToken={login.bulkInviteToken || undefined}
        />
      )}
    </>
  )
}
