import { createClient as createServiceClient } from '@supabase/supabase-js'

import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string; lpId: string }>
}

const PutSchema = z.object({
  videoUrl: z.string().url('URL de video inválida'),
})

// Service role client — bypasa el RLS de learning_paths que bloquearía
// la escritura cuando el LP no tiene asignación org-level en assignments.
// La autorización ya se validó con requireBusiness antes de usarlo.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug, lpId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const supabase = getServiceClient()

    const { error } = await supabase
      .from('organization_lp_intro_videos')
      .delete()
      .eq('organization_id', auth.organizationId)
      .eq('learning_path_id', lpId)

    if (error) {
      logger.error('DELETE LP intro-video error:', error)
      return NextResponse.json({ success: false, error: 'Error al eliminar el video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('DELETE LP intro-video error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
