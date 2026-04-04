'use server'

import { SessionService } from '../services/session.service'
import { redirect } from 'next/navigation'

function getRedirectDigest(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) {
    return null
  }

  return typeof error.digest === 'string' ? error.digest : null
}

export async function logoutAction() {
  try {
    // Destruir sesión personalizada
    await SessionService.destroySession()
    
    // Redirigir a la página de auth
    redirect('/auth')
  } catch (error) {
    
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = getRedirectDigest(error)
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección, no un error
        throw error // Re-lanzar para que Next.js maneje la redirección
      }
    }
    
    // En caso de error real, aún así redirigir
    redirect('/auth')
  }
}
