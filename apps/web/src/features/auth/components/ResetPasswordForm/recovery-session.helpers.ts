/**
 * Helpers para establecer la sesión de recuperación de contraseña de Supabase
 * en el navegador.
 *
 * Contexto: el cliente browser se crea con `detectSessionInUrl: true`, por lo
 * que supabase-js puede canjear el `?code=` de la URL automáticamente al
 * inicializar. El código es de un solo uso: un segundo canje manual siempre
 * falla aunque la sesión ya exista. Por eso el orden correcto es:
 *
 *   1. `getSession()` — espera a que termine la auto-detección; si ya hay
 *      sesión, no hay nada que canjear.
 *   2. Canje manual del código solo como fallback.
 *   3. Si el canje falla, re-verificar la sesión antes de declarar el enlace
 *      inválido (la auto-detección pudo haber consumido el código en paralelo).
 *
 * Además, cuando un enlace está vencido o ya usado, Supabase redirige con
 * `error_code=otp_expired` en el hash o query string: eso debe mostrarse como
 * "enlace expirado", no como error genérico.
 */

export type RecoveryUrlError = 'expired' | 'invalid'

interface SupabaseRecoveryAuthClient {
  auth: {
    getSession: () => Promise<{
      data: { session: { user: unknown } | null }
      error: { message: string } | null
    }>
    exchangeCodeForSession: (code: string) => Promise<{
      data: { session: { user: unknown } | null }
      error: { message: string } | null
    }>
  }
}

/**
 * Detecta errores que Supabase adjunta a la URL de redirección del enlace de
 * recuperación (p. ej. `#error=access_denied&error_code=otp_expired`).
 * Revisa hash y query string porque el formato varía según la versión del flujo.
 */
export function parseRecoveryUrlError(
  search: string,
  hash: string,
): RecoveryUrlError | null {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(search.replace(/^\?/, ''))

  const errorCode = hashParams.get('error_code') || searchParams.get('error_code')
  const error = hashParams.get('error') || searchParams.get('error')

  if (!errorCode && !error) {
    return null
  }

  if (errorCode === 'otp_expired') {
    return 'expired'
  }

  return 'invalid'
}

/**
 * Establece la sesión de recuperación tolerando la auto-detección de
 * `detectSessionInUrl`. Devuelve `true` si hay sesión utilizable para el
 * cambio de contraseña.
 */
export async function establishSupabaseRecoverySession(
  supabase: SupabaseRecoveryAuthClient,
  recoveryCode: string | null,
): Promise<boolean> {
  // getSession espera a que la inicialización del cliente (incluida la
  // auto-detección de la URL) haya terminado.
  const initial = await supabase.auth.getSession()
  if (initial.data.session?.user) {
    return true
  }

  if (recoveryCode) {
    const exchange = await supabase.auth.exchangeCodeForSession(recoveryCode)
    if (!exchange.error && exchange.data.session?.user) {
      return true
    }

    // El canje manual pudo fallar porque la auto-detección ya consumió el
    // código: la sesión existiría de todos modos.
    const retry = await supabase.auth.getSession()
    if (retry.data.session?.user) {
      return true
    }
  }

  return false
}
