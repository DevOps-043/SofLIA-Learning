import { REDIRECT_URI } from './calendar-auth.config'

export function parseGoogleOAuthError(errorData: { error?: string; error_description?: string }): string {
  const error = errorData.error || ''
  const description = errorData.error_description || ''

  if (error === 'access_denied' || description.includes('access_denied')) {
    if (description.includes('test') || description.includes('Testing')) {
      return 'TEST_MODE_USER_NOT_ADDED: Tu email no está agregado como usuario de prueba. Ve a Google Cloud Console > OAuth consent screen > Test users y agrega tu email.'
    }
    return 'ACCESS_DENIED: Acceso denegado. Asegúrate de aceptar todos los permisos solicitados.'
  }

  if (
    description.includes("doesn't comply with Google's OAuth 2.0 policy")
    || description.includes('OAuth 2.0 policy')
    || description.includes('unverified')
    || description.includes('validation rules')
  ) {
    return 'APP_NOT_VERIFIED: Google rechazó la conexión por políticas de OAuth. Posibles causas:\n'
      + '1. Los cambios en Google Cloud Console pueden tardar 10-20 minutos en aplicarse\n'
      + `2. Verifica que el redirect URI en Credentials coincida EXACTAMENTE con: ${REDIRECT_URI}\n`
      + '3. Asegúrate de que tu email esté en usuarios de prueba y espera unos minutos\n'
      + '4. Si el problema persiste, intenta crear nuevas credenciales OAuth 2.0'
  }

  if (error === 'redirect_uri_mismatch' || description.includes('redirect_uri')) {
    return `REDIRECT_URI_MISMATCH: La URI de redirección no coincide. Verifica que tengas configurado: ${REDIRECT_URI} en Google Cloud Console > Credentials > OAuth 2.0 Client ID.`
  }

  if (error === 'invalid_client' || description.includes('client_id')) {
    return 'INVALID_CLIENT: El Client ID es inválido. Verifica tu configuración en Google Cloud Console.'
  }

  if (error === 'invalid_grant' || description.includes('expired')) {
    return 'CODE_EXPIRED: El código de autorización ha expirado. Por favor, intenta conectar de nuevo.'
  }

  return description || error || 'Error desconocido al conectar con Google Calendar'
}
