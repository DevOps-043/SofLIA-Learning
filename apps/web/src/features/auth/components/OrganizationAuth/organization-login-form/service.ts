import type { LoginFormData } from '../../../types/auth.types'
import { clearAuthUserCache } from '../../../../../lib/auth/user-auth-cache'

export interface OrganizationLoginRedirectInfo {
  to: string
  message: string
  countdown: number
}

export function buildOrganizationLoginActionFormData(params: {
  data: LoginFormData
  organizationId: string
  organizationSlug: string
  invitationToken?: string | null
  bulkInviteToken?: string | null
  captchaToken?: string
}): FormData {
  const formData = new FormData()
  formData.append('emailOrUsername', params.data.emailOrUsername)
  formData.append('password', params.data.password)
  formData.append('rememberMe', params.data.rememberMe.toString())
  formData.append('organizationId', params.organizationId)
  formData.append('organizationSlug', params.organizationSlug)
  formData.append('captchaToken', params.captchaToken ?? '')

  if (params.invitationToken) {
    formData.append('invitationToken', params.invitationToken)
  }

  if (params.bulkInviteToken) {
    formData.append('bulkInviteToken', params.bulkInviteToken)
  }

  return formData
}

export function buildForcedAuthRedirectUrl(url: string): string {
  if (url === '/auth' || url === '/auth/') {
    return '/auth?redirect=force'
  }

  if (url.startsWith('/auth') && url.includes('?')) {
    return `${url}&redirect=force`
  }

  if (url.startsWith('/auth')) {
    return `${url}?redirect=force`
  }

  return url
}

export function formatRedirectCountdownMessage(
  message: string,
  countdown: number,
): string {
  return message.replace(
    '5 segundos',
    `${countdown} segundo${countdown !== 1 ? 's' : ''}`,
  )
}

export function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if ('digest' in error && typeof error.digest === 'string') {
    return error.digest.startsWith('NEXT_REDIRECT')
  }

  return 'message' in error && typeof error.message === 'string'
    ? error.message.includes('NEXT_REDIRECT')
    : false
}

export function clearPreviousLoginUserState(): void {
  clearAuthUserCache()
}
