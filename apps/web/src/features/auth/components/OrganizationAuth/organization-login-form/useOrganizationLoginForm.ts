'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import React from 'react'
import { getLoginSchema } from '../../LoginForm/LoginForm.schema'
import { loginAction } from '../../../actions/login'
import {
  clearSavedCredentials,
  getSavedCredentials,
  saveCredentials,
} from '../../../../../lib/auth/remember-me'
import type { LoginFormData } from '../../../types/auth.types'
import {
  buildForcedAuthRedirectUrl,
  buildOrganizationLoginActionFormData,
  clearPreviousLoginUserState,
  isNextRedirectError,
  type OrganizationLoginRedirectInfo,
} from './service'
import { clearClientSessionState } from '../../../services/logout-client.service'

interface UseOrganizationLoginFormParams {
  organizationId: string
  organizationSlug: string
}

function hasRedirectInfo(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined,
): result is { error: string; redirectMessage: string; redirectTo: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof result.error === 'string' &&
    'redirectTo' in result &&
    typeof result.redirectTo === 'string' &&
    'redirectMessage' in result &&
    typeof result.redirectMessage === 'string'
  )
}

function isSuccessfulLoginResult(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined,
): result is { success: true; redirectTo: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === true &&
    'redirectTo' in result &&
    typeof result.redirectTo === 'string'
  )
}

function getLoginResultError(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined,
) {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof result.error === 'string'
  )
    ? result.error
    : null
}

export function useOrganizationLoginForm({
  organizationId,
  organizationSlug,
}: UseOrganizationLoginFormParams) {
  const { t } = useTranslation('common')
  const searchParams = useSearchParams()
  const invitationToken = searchParams?.get('invitation_token')
  const bulkInviteToken = searchParams?.get('bulk_token')

  const [error, setError] = useState<string | null>(null)
  const [redirectInfo, setRedirectInfo] =
    useState<OrganizationLoginRedirectInfo | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const loginSchema = React.useMemo(() => getLoginSchema(t), [t])
  const redirectUrlRef = useRef<string | null>(null)
  const submitInFlightRef = useRef(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    const savedCredentials = getSavedCredentials()
    if (!savedCredentials) {
      return
    }

    form.setValue('emailOrUsername', savedCredentials.emailOrUsername)
    if (savedCredentials.password) {
      form.setValue('password', savedCredentials.password)
    }
    form.setValue('rememberMe', true)
  }, [form])

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      redirectUrlRef.current = null
      submitInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!redirectInfo || redirectInfo.countdown !== 0) {
      return
    }

    const urlToRedirect = redirectUrlRef.current || redirectInfo.to
    const finalUrl = buildForcedAuthRedirectUrl(urlToRedirect)

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isCleanedUp = false

    const performRedirect = () => {
      if (isCleanedUp) {
        return
      }

      timeoutId = setTimeout(() => {
        window.location.href = finalUrl
      }, 300)
    }

    if (urlToRedirect === '/auth' || urlToRedirect.startsWith('/auth')) {
      void clearClientSessionState().finally(() => {
        performRedirect()
      })
    } else {
      performRedirect()
    }

    return () => {
      isCleanedUp = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [redirectInfo])

  async function onSubmit(data: LoginFormData) {
    if (submitInFlightRef.current) {
      return
    }

    submitInFlightRef.current = true
    setError(null)
    setRedirectInfo(null)
    setIsPending(true)

    const finishPending = () => {
      submitInFlightRef.current = false
      setIsPending(false)
    }

    try {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }

      clearPreviousLoginUserState()

      if (data.rememberMe) {
        saveCredentials({
          emailOrUsername: data.emailOrUsername,
          password: data.password,
        })
      } else {
        clearSavedCredentials()
      }

      if (typeof window !== 'undefined' && organizationSlug) {
        try {
          localStorage.setItem('last_organization_slug', organizationSlug)
        } catch {
          // no-op
        }
      }

      const result = await loginAction(
        buildOrganizationLoginActionFormData({
          data,
          organizationId,
          organizationSlug,
          invitationToken,
          bulkInviteToken,
          captchaToken,
        }),
      )

      const resultError = getLoginResultError(result)
      if (resultError) {
        if (hasRedirectInfo(result)) {
          redirectUrlRef.current = result.redirectTo

          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }

          let countdown = 5
          setError(resultError)
          setRedirectInfo({
            to: result.redirectTo,
            message: result.redirectMessage,
            countdown,
          })

          countdownIntervalRef.current = setInterval(() => {
            countdown -= 1

            if (countdown > 0) {
              setRedirectInfo((currentRedirectInfo) =>
                currentRedirectInfo
                  ? { ...currentRedirectInfo, countdown }
                  : null,
              )
              return
            }

            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }

            setRedirectInfo((currentRedirectInfo) =>
              currentRedirectInfo
                ? { ...currentRedirectInfo, countdown: 0 }
                : null,
            )
          }, 1000)

          finishPending()
          return
        }

        setError(resultError)
        finishPending()
        return
      }

      if (isSuccessfulLoginResult(result)) {
        window.location.href = result.redirectTo
        return
      }
    } catch (submissionError) {
      if (isNextRedirectError(submissionError)) {
        submitInFlightRef.current = false
        throw submissionError
      }

      setError(t('auth.org.unexpectedError'))
      finishPending()
      return
    }

    finishPending()
  }

  return {
    bulkInviteToken,
    error,
    focusedField,
    form,
    invitationToken,
    isPending,
    onSubmit,
    redirectInfo,
    setFocusedField,
    setCaptchaToken,
    setShowPassword,
    showPassword,
  }
}
