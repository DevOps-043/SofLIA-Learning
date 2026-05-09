'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import React from 'react'
import { getRegisterSchema } from '../../RegisterForm/RegisterForm.schema'
import { registerAction } from '../../../actions/register'
import { useOrganizationAuthStyles } from '../useOrganizationAuthStyles'
import type { RegisterFormData } from '../../../types/auth.types'
import type { OrganizationRegisterFormProps } from './types'
import {
  buildOrganizationRegisterActionFormData,
  createOrganizationRegisterDefaultValues,
  getOrganizationRegisterRedirectPath,
  getOrganizationRegisterRoleTranslationKey,
} from './service'

export function useOrganizationRegisterForm({
  organizationId,
  organizationSlug,
  invitationToken,
  invitedEmail,
  invitedRole,
  bulkInviteToken,
}: Pick<
  OrganizationRegisterFormProps,
  | 'organizationId'
  | 'organizationSlug'
  | 'invitationToken'
  | 'invitedEmail'
  | 'invitedRole'
  | 'bulkInviteToken'
>) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { palette } = useOrganizationAuthStyles(organizationSlug)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('MX')
  const [dialCode, setDialCode] = useState('+52')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const registerSchema = React.useMemo(() => getRegisterSchema(t), [t])

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: createOrganizationRegisterDefaultValues(invitedEmail),
  })

  const { setValue } = form

  useEffect(() => {
    if (!invitedEmail) {
      return
    }

    setValue('email', invitedEmail)
    setValue('confirmEmail', invitedEmail)
  }, [invitedEmail, setValue])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = setTimeout(() => {
      router.push(getOrganizationRegisterRedirectPath(organizationSlug))
    }, 2000)

    return () => clearTimeout(timer)
  }, [organizationSlug, router, success])

  function onCountryChange(code: string, dial: string) {
    setSelectedCountryCode(code)
    setDialCode(dial)
    setValue('countryCode', code)
  }

  async function onSubmit(data: RegisterFormData) {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        const result = await registerAction(
          buildOrganizationRegisterActionFormData({
            data,
            organizationId,
            organizationSlug,
            invitationToken,
            bulkInviteToken,
          }),
        )

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success) {
          setSuccess(result.message || t('auth.register.success'))
        }
      } catch {
        setError(t('auth.org.unexpectedError'))
      }
    })
  }

  return {
    bulkInviteToken,
    dialCode,
    error,
    form,
    invitedRoleTranslationKey: getOrganizationRegisterRoleTranslationKey(invitedRole),
    isPending,
    onCountryChange,
    onSubmit,
    palette,
    selectedCountryCode,
    setError,
    setShowLegalModal,
    showLegalModal,
    success,
  }
}
