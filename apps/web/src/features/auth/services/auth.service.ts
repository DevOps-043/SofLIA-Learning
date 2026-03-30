import crypto from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '../../../lib/supabase/server'

export class AuthService {
  static async getFingerprint(): Promise<string> {
    const headersList = await headers()
    const ua = headersList.get('user-agent') || ''
    const lang = headersList.get('accept-language') || ''
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    
    return crypto
      .createHash('sha256')
      .update(`${ua}|${lang}|${ip}`)
      .digest('hex')
  }

  static async validateSession(
    userId: string, 
    fingerprint: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_session')
        .select('id, expires_at')
        .eq('user_id', userId)
        .eq('jwt_id', fingerprint) // Usamos jwt_id en lugar de fingerprint
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  static async clearExpiredSessions(): Promise<void> {
    try {
      const supabase = await createClient()
      
      await (supabase
        .from('user_session') as any)
        .update({ revoked: true })
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      // Log error but don't throw to avoid breaking auth flow
    }
  }
}
