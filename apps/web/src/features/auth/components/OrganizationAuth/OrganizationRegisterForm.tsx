'use client'

import type { ComponentProps, JSX } from 'react'
import dynamic from 'next/dynamic'
import { ToastNotification } from '../../../../core/components/ToastNotification'
import {
  OrganizationRegisterActions,
  OrganizationRegisterCredentialsFields,
  OrganizationRegisterIdentityFields,
  type OrganizationRegisterFormProps,
  useOrganizationRegisterForm,
} from './organization-register-form'

const LegalDocumentsModal = dynamic(
  () =>
    import('../LegalDocumentsModal').then((module) => ({
      default: module.LegalDocumentsModal,
    })),
  {
    ssr: false,
  },
)

const SafeLegalDocumentsModal = LegalDocumentsModal as unknown as (
  props: ComponentProps<typeof LegalDocumentsModal>
) => JSX.Element

export function OrganizationRegisterForm(
  props: OrganizationRegisterFormProps,
) {
  const registerForm = useOrganizationRegisterForm(props)
  const {
    bulkInviteToken,
    dialCode,
    error,
    form,
    invitedRoleTranslationKey,
    isPending,
    onCountryChange,
    onSubmit,
    palette,
    selectedCountryCode,
    setError,
    setShowLegalModal,
    showLegalModal,
    success,
  } = registerForm

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <OrganizationRegisterIdentityFields
          register={register}
          errors={errors}
          palette={palette}
          invitedEmail={props.invitedEmail}
          invitedRole={props.invitedRole}
          invitedRoleTranslationKey={invitedRoleTranslationKey}
          bulkInviteToken={bulkInviteToken}
          success={success}
        />

        <OrganizationRegisterCredentialsFields
          register={register}
          errors={errors}
          palette={palette}
          selectedCountryCode={selectedCountryCode}
          dialCode={dialCode}
          onCountryChange={onCountryChange}
        />

        <OrganizationRegisterActions
          register={register}
          errors={errors}
          palette={palette}
          isPending={isPending}
          organizationId={props.organizationId}
          organizationSlug={props.organizationSlug}
          invitationToken={props.invitationToken}
          bulkInviteToken={props.bulkInviteToken}
          googleLoginEnabled={props.googleLoginEnabled}
          microsoftLoginEnabled={props.microsoftLoginEnabled}
          onOpenLegalModal={() => setShowLegalModal(true)}
        />
      </form>

      <SafeLegalDocumentsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      <ToastNotification
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
        type="error"
        duration={6000}
      />
    </>
  )
}
