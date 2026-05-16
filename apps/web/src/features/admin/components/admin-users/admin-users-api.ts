import type { TFunction } from 'i18next'
import type { AdminUser } from '../../services/adminUsers.service'
import type { NewAdminUserData } from '../AddUserModal'

const parseErrorResponse = async (response: Response): Promise<Record<string, unknown>> => {
  const data: unknown = await response.json().catch(() => ({}))
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

const getStringValue = (source: Record<string, unknown>, key: string) => {
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

const formatValidationErrors = (errors: unknown) => {
  if (!Array.isArray(errors)) return null
  const messages = errors
    .map((error) => {
      if (!error || typeof error !== 'object') return null
      const validationError = error as Record<string, unknown>
      const field = getStringValue(validationError, 'field')
      const message = getStringValue(validationError, 'message')
      if (!message) return null
      return field ? `${field}: ${message}` : message
    })
    .filter((message): message is string => Boolean(message))

  return messages.length > 0 ? messages.join(', ') : null
}

const hasInvalidDataMessage = (message: unknown) =>
  message === 'Datos invÃ¡lidos' || message === 'Datos invÃƒÂ¡lidos'

export async function saveAdminUser(
  user: AdminUser,
  userData: Partial<AdminUser>,
  t: TFunction<'admin'>,
) {
  const response = await fetch(`/api/admin/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (response.ok) return
  const errorData = await parseErrorResponse(response)
  if (hasInvalidDataMessage(errorData.message) && errorData.errors) {
    const validationMessage = formatValidationErrors(errorData.errors)
    if (validationMessage) throw new Error(validationMessage)
  }

  throw new Error(
    getStringValue(errorData, 'error') ||
      getStringValue(errorData, 'message') ||
      t('users.page.errors.updateFailed'),
  )
}

export async function deleteAdminUser(user: AdminUser, t: TFunction<'admin'>) {
  const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
  if (response.ok) return
  const errorData = await parseErrorResponse(response)
  throw new Error(getStringValue(errorData, 'error') || t('users.page.errors.deleteFailed'))
}

export async function createAdminUser(userData: NewAdminUserData, t: TFunction<'admin'>) {
  const response = await fetch('/api/admin/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (response.ok) return
  const errorData = await parseErrorResponse(response)
  if (hasInvalidDataMessage(errorData.message) && errorData.errors) {
    const validationMessage = formatValidationErrors(errorData.errors)
    if (validationMessage) throw new Error(validationMessage)
  }

  throw new Error(
    getStringValue(errorData, 'error') ||
      getStringValue(errorData, 'message') ||
      t('users.page.errors.createFailed'),
  )
}
