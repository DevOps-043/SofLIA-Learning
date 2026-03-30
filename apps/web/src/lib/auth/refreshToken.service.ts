import { createClient } from '../supabase/server'
import { cookies } from 'next/headers'
import { SECURE_COOKIE_OPTIONS } from './cookie-config'
import * as crypto from 'crypto'
// bcrypt eliminado - se usa SHA-256 para hashear tokens (determinístico y más rápido)

/**
 * ✅ ISSUE #17: Servicio de Refresh Tokens
 * 
 * Sistema de autenticación con tokens de corta duración para mejorar seguridad:
 * - Access Token: 30 minutos (cookie httpOnly)
 * - Refresh Token: 7-30 días según "remember me" (DB)
 * - Validación de inactividad: logout automático después de 24h sin uso
 * - Device fingerprinting para detectar uso sospechoso
 * 
 * Ventajas:
 * - Reduce ventana de vulnerabilidad de 30 días → 30 minutos
 * - Logout automático por inactividad
 * - Revocación inmediata de sesiones
 * - Tracking de dispositivos y ubicaciones
 */

export interface RefreshToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
  last_used_at: string
  device_fingerprint?: string
  ip_address?: string
  user_agent?: string
  is_revoked: boolean
  revoked_at?: string
  revoked_reason?: string
}

export interface SessionInfo {
  userId: string
  accessToken: string
  refreshToken: string
  accessExpiresAt: Date
  refreshExpiresAt: Date
}

export class RefreshTokenService {
  // ✅ Access token: 30 minutos (corta duración)
  private static ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000 // 30 minutos

  // ✅ Refresh token: 7 días normal, 30 días con "remember me"
  private static REFRESH_TOKEN_EXPIRY_MS = (rememberMe: boolean) =>
    (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000

  // ✅ Inactividad máxima: 24 horas
  private static MAX_INACTIVITY_HOURS = 24

  /**
   * Genera un refresh token único y seguro
   */
  private static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hashea un token para almacenamiento seguro usando SHA-256
   * ⚠️ IMPORTANTE: Usar SHA-256 (determinístico) en lugar de bcrypt (no determinístico)
   * para permitir búsquedas directas por token_hash en la BD
   */
  private static async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Verifica un token contra su hash
   * Público para permitir validación desde SessionService
   * ⚠️ IMPORTANTE: Usar SHA-256 para consistencia con hashToken
   */
  static async verifyToken(token: string, hash: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    return tokenHash === hash
  }

  /**
   * ⚡ OPTIMIZACIÓN: Hashea un token para búsqueda directa en BD
   * Permite query indexed en lugar de fetch ALL + loop
   * Público para uso desde SessionService
   * ⚠️ IMPORTANTE: Usar SHA-256 (determinístico) para que la búsqueda funcione
   */
  static async hashTokenForLookup(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Obtiene el fingerprint del dispositivo (basado en headers)
   */
  private static async getDeviceFingerprint(request?: Request): Promise<string> {
    if (!request) return 'unknown'

    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''

    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
    return crypto.createHash('sha256').update(fingerprintData).digest('hex')
  }

  /**
   * Obtiene la IP del cliente
   */
  private static getIpAddress(request?: Request): string {
    if (!request) return 'unknown'

    // Intentar obtener IP real (detrás de proxy/CDN)
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    )
  }

  /**
   * ✅ ISSUE #17: Crear sesión con access token y refresh token
   * Genera tokens y los guarda en la base de datos, pero NO establece cookies.
   * Las cookies deben establecerse en el Server Action que llama a este método.
   * @param request Opcional: Request para obtener información del dispositivo
   */
  static async createSession(
    userId: string,
    rememberMe: boolean = false,
    request?: Request
  ): Promise<SessionInfo> {
    const supabase = await createClient()

    // Generar tokens
    const accessToken = this.generateRefreshToken() // Usar como access token simple
    const refreshToken = this.generateRefreshToken()

    // Calcular expiraciones
    const accessExpiresAt = new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY_MS)
    const refreshExpiresAt = new Date(
      Date.now() + this.REFRESH_TOKEN_EXPIRY_MS(rememberMe)
    )

    // Hashear refresh token para almacenamiento
    const tokenHash = await this.hashToken(refreshToken)

    // Guardar refresh token en DB
    const { error } = await supabase.from('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: refreshExpiresAt.toISOString(),
      device_fingerprint: await this.getDeviceFingerprint(request),
      ip_address: this.getIpAddress(request),
      user_agent: request?.headers.get('user-agent') || null,
      is_revoked: false
    })

    if (error) {
      throw new Error(`Error creando refresh token: ${error.message}`)
    }

    // Retornar información de sesión (sin establecer cookies)
    return {
      userId,
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt
    }
  }

  /**
   * ✅ ISSUE #17: Refrescar sesión usando refresh token
   */
  static async refreshSession(request?: Request): Promise<{ userId: string }> {
    const supabase = await createClient()
    const cookieStore = await cookies()

    // Obtener refresh token de la cookie
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      throw new Error('No refresh token found')
    }

    // Buscar token en la base de datos (probar contra todos los hashes)
    const { data: tokens, error: fetchError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('is_revoked', false)
      .gte('expires_at', new Date().toISOString())

    if (fetchError) {
      throw new Error(`Error fetching refresh tokens: ${fetchError.message}`)
    }

    // Verificar el token contra los hashes
    let tokenData: RefreshToken | null = null

    for (const token of tokens || []) {
      if (await this.verifyToken(refreshToken, token.token_hash)) {
        tokenData = token
        break
      }
    }

    if (!tokenData) {
      throw new Error('Invalid or expired refresh token')
    }

    // ✅ Verificar inactividad (24 horas sin uso)
    const lastUsed = new Date(tokenData.last_used_at)
    const hoursSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastUse > this.MAX_INACTIVITY_HOURS) {
      // Revocar token por inactividad
      await this.revokeToken(tokenData.id, 'Sesión expirada por inactividad')
      throw new Error('Session expired due to inactivity')
    }

    // Actualizar last_used_at
    await supabase
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // ✅ Generar nuevo access token con configuración segura
    const newAccessToken = this.generateRefreshToken()
    const accessExpiresAt = new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY_MS)

    cookieStore.set('access_token', newAccessToken, {
      ...SECURE_COOKIE_OPTIONS,
      expires: accessExpiresAt,
    })

    return { userId: tokenData.user_id }
  }

  /**
   * Revocar un refresh token específico
   */
  static async revokeToken(tokenId: string, reason: string = 'Manual revocation'): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason
      })
      .eq('id', tokenId)
  }

  /**
   * Revocar todos los tokens de un usuario (logout completo)
   */
  static async revokeAllUserTokens(
    userId: string,
    reason: string = 'User logout'
  ): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason
      })
      .eq('user_id', userId)
      .eq('is_revoked', false)

  }

  /**
   * Destruir sesión actual (logout)
   */
  static async destroySession(userId?: string): Promise<void> {
    const cookieStore = await cookies()

    // Eliminar cookies
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')

    // Si tenemos userId, revocar todos sus tokens
    if (userId) {
      await this.revokeAllUserTokens(userId, 'User logout')
    }

  }

  /**
   * Obtener todas las sesiones activas de un usuario
   */
  static async getUserActiveSessions(userId: string): Promise<RefreshToken[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gte('expires_at', new Date().toISOString())
      .order('last_used_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching active sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Limpiar tokens expirados (ejecutar periódicamente)
   */
  static async cleanExpiredTokens(): Promise<number> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('refresh_tokens')
      .delete()
      .or(`expires_at.lt.${new Date().toISOString()},and(is_revoked.eq.true,revoked_at.lt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`)
      .select('id')

    if (error) {
      return 0
    }

    const count = data?.length || 0
    if (count > 0) {
    }

    return count
  }
}
