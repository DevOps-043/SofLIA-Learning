import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/requireUser'
import { buildPlatformIntroTeaserSourceUrl } from '@/lib/media/platform-intro-teaser'
import { resolveHlsUrlForSource } from '@/lib/media/server/hls-source-resolver.server'
import { logger } from '@/lib/utils/logger'

/**
 * Devuelve la URL de reproduccion del teaser institucional que se muestra
 * antes del tour de onboarding.
 *
 * Resuelve a la variante HLS (master.m3u8) cuando el teaser ya fue
 * transcodificado, de modo que el reproductor habilite el selector de
 * resolucion. Si no existe un job de transcodificacion completado, devuelve
 * el MP4 original como fallback (siempre reproducible).
 */
export async function GET() {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth

  const sourceUrl = buildPlatformIntroTeaserSourceUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
  if (!sourceUrl) {
    return NextResponse.json({ success: true, videos: [] })
  }

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const playbackUrl = await resolveHlsUrlForSource(supabase, sourceUrl)
    return NextResponse.json({
      success: true,
      videos: playbackUrl ? [playbackUrl] : [],
    })
  } catch (error) {
    logger.error('GET intro-teaser error:', error)
    // No fatal: ante cualquier fallo el MP4 original sigue siendo reproducible.
    return NextResponse.json({ success: true, videos: [sourceUrl] })
  }
}
